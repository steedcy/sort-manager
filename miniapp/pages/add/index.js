const api = require('../../utils/api')
const { validateQuickItem } = require('../../utils/item-data')
const { requireSession } = require('../../utils/auth')

function initialForm() {
  return {
    name: '',
    quantity: '1',
    price: '',
    description: '',
    purchaseDate: '',
    expiryDate: '',
    categoryId: null,
    locationId: null,
  }
}

Page({
  data: {
    form: initialForm(),
    categories: [],
    locations: [],
    categoryIndex: -1,
    locationIndex: -1,
    showMore: false,
    metadataLoading: false,
    submitting: false,
    errors: {},
    metadataError: '',
  },
  onShow() {
    if (requireSession() && !this.data.categories.length && !this.data.locations.length) this.loadMetadata()
  },
  async loadMetadata() {
    this.setData({ metadataLoading: true, metadataError: '' })
    try {
      const [categories, locations] = await Promise.all([api.categories(), api.locations()])
      this.setData({ categories: categories || [], locations: locations || [] })
    } catch (error) {
      this.setData({ metadataError: error.message || '分类和位置加载失败' })
    } finally {
      this.setData({ metadataLoading: false })
    }
  },
  updateField(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: event.detail.value, [`errors.${field}`]: '' })
  },
  toggleMore() { this.setData({ showMore: !this.data.showMore }) },
  selectCategory(event) {
    const categoryIndex = Number(event.detail.value)
    this.setData({ categoryIndex, 'form.categoryId': this.data.categories[categoryIndex].id })
  },
  selectLocation(event) {
    const locationIndex = Number(event.detail.value)
    this.setData({ locationIndex, 'form.locationId': this.data.locations[locationIndex].id })
  },
  selectDate(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: event.detail.value })
  },
  buildPayload() {
    const form = this.data.form
    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
    }
    ;['description', 'purchaseDate', 'expiryDate'].forEach((field) => {
      if (form[field]) payload[field] = form[field]
    })
    if (form.price !== '') payload.price = Number(form.price)
    if (form.categoryId) payload.categoryId = form.categoryId
    if (form.locationId) payload.locationId = form.locationId
    return payload
  },
  async submit() {
    if (this.data.submitting) return
    const errors = validateQuickItem(this.data.form)
    if (this.data.form.price !== '' && (!Number.isFinite(Number(this.data.form.price)) || Number(this.data.form.price) < 0)) {
      errors.price = '单价不能小于 0'
    }
    if (Object.keys(errors).length) {
      this.setData({ errors })
      return
    }
    this.setData({ submitting: true, errors: {} })
    try {
      await api.createItem(this.buildPayload())
      this.setData({
        form: initialForm(),
        categoryIndex: -1,
        locationIndex: -1,
        showMore: false,
      })
      wx.showToast({ title: '已录入家庭账本', icon: 'success' })
    } catch (error) {
      wx.showModal({ title: '录入没有完成', content: error.message || '请检查信息后重试', showCancel: false })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
