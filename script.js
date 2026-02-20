// -------------------
// RSVP Form Submission
// -------------------
const rsvpForm = document.getElementById('rsvp-form')
if (rsvpForm) {
  rsvpForm.addEventListener('submit', async e => {
    e.preventDefault()
    const formData = new FormData(rsvpForm)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      attending_count: parseInt(formData.get('attending_count')),
      extended_invite: formData.get('extended_invite') === 'on',
      dietary_notes: formData.get('dietary_notes'),
      turnstile_token: document.querySelector('.cf-turnstile-response').value
    }

    const resp = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await resp.json()
    const message = document.getElementById('message')
    if (result.success) {
      message.innerText = 'RSVP submitted! Thank you!'
      rsvpForm.reset()
      if (window.turnstile) window.turnstile.reset()
    } else {
      message.innerText = 'Error: ' + (result.error || 'Unknown')
    }
  })
}

// -------------------
// Admin Panel
// -------------------
const loadBtn = document.getElementById('load-data')
if (loadBtn) {
  loadBtn.addEventListener('click', async () => {
    const password = document.getElementById('admin-password').value
    const resp = await fetch('/api/admin', {
      headers: { 'x-admin-password': password }
    })
    if (resp.status === 200) {
      const data = await resp.json()
      document.getElementById('output').innerText = JSON.stringify(data, null, 2)
    } else {
      document.getElementById('output').innerText = 'Unauthorized or error'
    }
  })
}

const downloadBtn = document.getElementById('download-csv')
if (downloadBtn) {
  downloadBtn.addEventListener('click', async () => {
    const password = document.getElementById('admin-password').value
    const resp = await fetch('/api/export', {
      headers: { 'x-admin-password': password }
    })
    if (resp.status === 200) {
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rsvps.csv'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert('Unauthorized or error')
    }
  })
}
