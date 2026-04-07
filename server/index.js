const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 路由
app.use('/api/landmarks', require('./routes/landmarks'))
app.use('/api/upload', require('./routes/upload'))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { status: 'running' } })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`Earth Culture API 服务器运行在 http://localhost:${PORT}`)
})
