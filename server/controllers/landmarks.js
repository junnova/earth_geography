const Landmark = require('../models/landmark')

const landmarkController = {
  getAll(req, res) {
    const data = Landmark.findAll()
    res.json({ code: 200, data, message: 'ok' })
  },

  getById(req, res) {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ code: 400, data: null, message: '无效的 ID' })

    const data = Landmark.findById(id)
    if (!data) return res.status(404).json({ code: 404, data: null, message: '未找到' })
    res.json({ code: 200, data, message: 'ok' })
  },

  search(req, res) {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ code: 200, data: [], message: 'ok' })

    const data = Landmark.search(q)
    res.json({ code: 200, data, message: 'ok' })
  },

  create(req, res) {
    const { country_name, country_code, latitude, longitude } = req.body
    if (!country_name || !country_code || latitude == null || longitude == null) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填字段' })
    }

    const data = Landmark.create({
      country_name,
      country_code: country_code.toUpperCase(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      landmark_name: req.body.landmark_name || '',
      description: req.body.description || '',
      icon_url: req.body.icon_url || '',
      image_url: req.body.image_url || '',
      category: req.body.category || ''
    })
    res.status(201).json({ code: 201, data, message: '创建成功' })
  },

  update(req, res) {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ code: 400, data: null, message: '无效的 ID' })

    const existing = Landmark.findById(id)
    if (!existing) return res.status(404).json({ code: 404, data: null, message: '未找到' })

    const data = Landmark.update(id, {
      country_name: req.body.country_name || existing.country_name,
      country_code: (req.body.country_code || existing.country_code).toUpperCase(),
      latitude: req.body.latitude != null ? parseFloat(req.body.latitude) : existing.latitude,
      longitude: req.body.longitude != null ? parseFloat(req.body.longitude) : existing.longitude,
      landmark_name: req.body.landmark_name ?? existing.landmark_name,
      description: req.body.description ?? existing.description,
      icon_url: req.body.icon_url ?? existing.icon_url,
      image_url: req.body.image_url ?? existing.image_url,
      category: req.body.category ?? existing.category
    })
    res.json({ code: 200, data, message: '更新成功' })
  },

  delete(req, res) {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ code: 400, data: null, message: '无效的 ID' })

    const existing = Landmark.findById(id)
    if (!existing) return res.status(404).json({ code: 404, data: null, message: '未找到' })

    Landmark.delete(id)
    res.json({ code: 200, data: null, message: '删除成功' })
  }
}

module.exports = landmarkController
