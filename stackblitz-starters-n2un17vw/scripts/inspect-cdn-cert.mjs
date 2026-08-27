import tls from "node:tls";

await new Promise((resolve, reject) => {
  const socket = tls.connect({
    host: "cdn.voskopulence.com",
    port: 443,
    servername: "cdn.voskopulence.com",
    rejectUnauthorized: false,
  }, () => {
    const cert = socket.getPeerCertificate(true);
    console.log("CDN_CERT", JSON.stringify({
      subject: cert.subject,
      issuer: cert.issuer,
      valid_from: cert.valid_from,
      valid_to: cert.valid_to,
      fingerprint256: cert.fingerprint256,
      subjectaltname: cert.subjectaltname,
      authorized: socket.authorized,
      authorizationError: socket.authorizationError,
    }));
    socket.end();
    resolve();
  });
  socket.on("error", reject);
});
