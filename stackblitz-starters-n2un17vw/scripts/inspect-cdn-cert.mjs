import tls from "node:tls";
import dns from "node:dns/promises";

async function inspectTls(host, servername = host) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host,
      port: 443,
      servername,
      rejectUnauthorized: false,
    }, () => {
      const cert = socket.getPeerCertificate(true);
      const result = {
        host,
        servername,
        subject: cert.subject,
        issuer: cert.issuer,
        valid_from: cert.valid_from,
        valid_to: cert.valid_to,
        fingerprint256: cert.fingerprint256,
        subjectaltname: cert.subjectaltname,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError,
      };
      socket.end();
      resolve(result);
    });
    socket.on("error", reject);
  });
}

const customHost = "cdn.voskopulence.com";
const cname = await dns.resolveCname(customHost).catch(() => []);
console.log("CDN_CNAME", JSON.stringify(cname));
console.log("CDN_CERT", JSON.stringify(await inspectTls(customHost)));

for (const target of cname) {
  console.log("CDN_TARGET_CERT", JSON.stringify(await inspectTls(target)));
}
