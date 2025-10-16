      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[200] lg:hidden transition-opacity duration-200 ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        {/* Frosted backdrop */}
        <div
          className="absolute inset-0 bg-[#004642]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#004642]/60"
          onClick={() => setMenuOpen(false)}
        />
