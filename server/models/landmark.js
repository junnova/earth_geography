const db = require('../db')

const Landmark = {
  findAll() {
    return db.prepare('SELECT * FROM landmarks ORDER BY id').all()
  },

  findById(id) {
    return db.prepare('SELECT * FROM landmarks WHERE id = ?').get(id)
  },

  search(keyword) {
    const like = `%${keyword}%`
    return db.prepare(
      'SELECT * FROM landmarks WHERE country_name LIKE ? OR landmark_name LIKE ? ORDER BY id'
    ).all(like, like)
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO landmarks (country_name, country_code, latitude, longitude, landmark_name, description, icon_url, image_url, category)
      VALUES (@country_name, @country_code, @latitude, @longitude, @landmark_name, @description, @icon_url, @image_url, @category)
    `)
    const result = stmt.run(data)
    return this.findById(result.lastInsertRowid)
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE landmarks SET
        country_name = @country_name,
        country_code = @country_code,
        latitude = @latitude,
        longitude = @longitude,
        landmark_name = @landmark_name,
        description = @description,
        icon_url = @icon_url,
        image_url = @image_url,
        category = @category,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `)
    stmt.run({ ...data, id })
    return this.findById(id)
  },

  delete(id) {
    return db.prepare('DELETE FROM landmarks WHERE id = ?').run(id)
  }
}

module.exports = Landmark
