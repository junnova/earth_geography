const express = require('express')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const router = express.Router()

// 允许的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename(req, file, cb) {
    const ext = path.extname(file.originalname)
    const name = crypto.randomBytes(16).toString('hex')
    cb(null, `${name}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型，仅允许 jpg/png/svg/webp'))
    }
  }
})

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, data: null, message: '未上传文件' })
  }
  const url = `/uploads/${req.file.filename}`
  res.json({ code: 200, data: { url }, message: '上传成功' })
})

// multer 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ code: 400, data: null, message: '文件大小不能超过 2MB' })
    }
  }
  res.status(400).json({ code: 400, data: null, message: err.message })
})

module.exports = router
