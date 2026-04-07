const express = require('express')
const router = express.Router()
const controller = require('../controllers/landmarks')

// 搜索（必须在 :id 之前）
router.get('/search', controller.search)

// CRUD
router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.delete)

module.exports = router
