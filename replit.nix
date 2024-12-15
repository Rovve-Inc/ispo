{pkgs}: {
  deps = [
    pkgs.rustc
    pkgs.pkg-config
    pkgs.libxcrypt
    pkgs.libiconv
    pkgs.cargo
    pkgs.unzip
    pkgs.postgresql
    pkgs.openssl
  ];
}
