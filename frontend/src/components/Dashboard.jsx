import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const CATEGORIES = ['Academic', 'Hostel', 'Transport', 'Other']

const emptyForm = { title: '', description: '', category: 'Academic', status: 'Pending' }

export default function Dashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('name') || 'Student'
  const token = localStorage.getItem('token')

  const [grievances, setGrievances] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchGrievances = useCallback(async (q = '') => {
    try {
      const url = q ? `${API}/grievances/search?title=${q}` : `${API}/grievances`
      const { data } = await axios.get(url, { headers })
      setGrievances(data)
    } catch {
      setMsg('Failed to load grievances')
    }
  }, [])

  useEffect(() => { fetchGrievances() }, [fetchGrievances])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editId) {
        await axios.put(`${API}/grievances/${editId}`, form, { headers })
        setMsg('Grievance updated!')
      } else {
        await axios.post(`${API}/grievances`, form, { headers })
        setMsg('Grievance submitted!')
      }
      setForm(emptyForm)
      setEditId(null)
      setShowForm(false)
      fetchGrievances()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error saving grievance')
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const handleEdit = g => {
    setForm({ title: g.title, description: g.description, category: g.category, status: g.status })
    setEditId(g._id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this grievance?')) return
    try {
      await axios.delete(`${API}/grievances/${id}`, { headers })
      setMsg('Deleted successfully')
      fetchGrievances()
      setTimeout(() => setMsg(''), 3000)
    } catch {
      setMsg('Delete failed')
    }
  }

  const handleSearch = e => {
    setSearch(e.target.value)
    fetchGrievances(e.target.value)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const categoryColor = cat => ({
    Academic: 'badge-academic', Hostel: 'badge-hostel',
    Transport: 'badge-transport', Other: 'badge-other'
  }[cat] || 'badge-other')

  const pending = grievances.filter(g => g.status === 'Pending').length
  const resolved = grievances.filter(g => g.status === 'Resolved').length

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">🎓 Grievance Portal</div>
        <div className="nav-right">
          <span className="nav-user">Hello, {name}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dash-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card stat-total">
            <div className="stat-num">{grievances.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-num">{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-resolved">
            <div className="stat-num">{resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        {msg && <div className={`alert ${msg.includes('fail') || msg.includes('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

        {/* Submit / Edit Form */}
        <div className="section-header">
          <h2>{editId ? 'Edit Grievance' : 'Submit Grievance'}</h2>
          <button className="btn-toggle" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm) }}>
            {showForm ? '✕ Cancel' : '+ New Grievance'}
          </button>
        </div>

        {showForm && (
          <div className="card form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input name="title" value={form.title} onChange={handleChange}
                    placeholder="Brief title of your grievance" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe your issue in detail..." rows={4} required />
              </div>
              {editId && (
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option>Pending</option>
                    <option>Resolved</option>
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editId ? 'Update Grievance' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search grievances by title..."
            value={search} onChange={handleSearch} />
        </div>

        {/* List */}
        <h2 className="section-title">My Grievances</h2>
        {grievances.length === 0
          ? <div className="empty-state">No grievances found. Submit one above!</div>
          : <div className="grievance-list">
              {grievances.map(g => (
                <div className="grievance-card" key={g._id}>
                  <div className="grievance-top">
                    <div>
                      <h3 className="grievance-title">{g.title}</h3>
                      <p className="grievance-date">{new Date(g.date).toLocaleDateString()}</p>
                    </div>
                    <div className="badges">
                      <span className={`badge ${categoryColor(g.category)}`}>{g.category}</span>
                      <span className={`badge ${g.status === 'Resolved' ? 'badge-resolved' : 'badge-pending'}`}>{g.status}</span>
                    </div>
                  </div>
                  <p className="grievance-desc">{g.description}</p>
                  <div className="grievance-actions">
                    <button className="btn-edit" onClick={() => handleEdit(g)}>✏️ Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(g._id)}>🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}