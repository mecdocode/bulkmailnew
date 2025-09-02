const fs = require('fs')
const path = require('path')

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// Copy client/dist to root dist
const clientDist = path.join(__dirname, '..', 'client', 'dist')
const rootDist = path.join(__dirname, '..', 'dist')

if (fs.existsSync(clientDist)) {
  copyDir(clientDist, rootDist)
  console.log('Successfully copied client/dist to dist/')
} else {
  console.error('client/dist directory not found')
  process.exit(1)
}
