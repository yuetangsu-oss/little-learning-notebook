import sharp from 'sharp'

const icon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#F4D7CA"/>
  <circle cx="414" cy="104" r="72" fill="#F0E2B9" opacity="0.9"/>
  <rect x="112" y="86" width="288" height="340" rx="36" fill="#FFFDF8"/>
  <rect x="112" y="86" width="34" height="340" rx="17" fill="#E87E66"/>
  <path d="M194 184H337M194 250H337M194 316H290" stroke="#789AB5" stroke-width="24" stroke-linecap="round"/>
  <circle cx="128" cy="164" r="9" fill="#FFFDF8"/>
  <circle cx="128" cy="256" r="9" fill="#FFFDF8"/>
  <circle cx="128" cy="348" r="9" fill="#FFFDF8"/>
</svg>`

await Promise.all([
  sharp(Buffer.from(icon)).resize(192, 192).png().toFile('public/icon-192.png'),
  sharp(Buffer.from(icon)).resize(512, 512).png().toFile('public/icon-512.png'),
])
