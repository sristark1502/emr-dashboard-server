const nodemailer = require('nodemailer');

// ===== GOOGLE SHEETS CONFIG =====
const SHEET_ID = '1APzFDrFhKW4SqUmbwNyAyG723Gmg2zNsk95_6RDiRws';
const API_KEY = 'AIzaSyBecbJU49RN53QO2POXTQKjvHZ3gkPnsEg';
const SHEET_NAME = 'Service Report';

// ===== LOAD COMPLAINTS FROM GOOGLE SHEETS =====
async function loadComplaints() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A1:N500?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Google Sheets API error: ' + res.status);
  const data = await res.json();
  const rows = data.values || [];
  if (rows.length < 2) return [];

  const complaints = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[1] && !r[2]) continue;
    const status = (r[8] || 'Pending').toString().trim().toUpperCase();
    complaints.push({
      serialNo: 'EMR-GJ-2026-' + String(i).padStart(3, '0'),
      companyName: (r[1] || '').toString().trim(),
      location: (r[2] || '').toString().trim(),
      customerName: (r[3] || '').toString().trim(),
      jobSerialNo: (r[4] || '').toString().trim().replace(/\.0$/, ''),
      issueDescription: (r[5] || '').toString().trim(),
      actionTaken: (r[6] || '').toString().trim(),
      status: status.includes('COMPLETE') ? 'Complete' : 'Pending',
      plannedDate: (r[9] || '').toString().trim(),
      completedDate: (r[10] || '').toString().trim(),
      engineerAssigned: (r[11] || '').toString().trim(),
      materialReq: (r[12] || '').toString().trim(),
    });
  }
  return complaints;
}

function generateEmailHTML(pending, materialItems, completeCount, today) {
  let html = `
  <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:700px;margin:0 auto;background:#fff">
    <div style="background:linear-gradient(135deg,#BE1E2D,#8B1520);padding:20px 30px;border-radius:12px 12px 0 0">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:220px;vertical-align:middle">
          <span style="font-family:'Arial Black',Impact,sans-serif;font-size:36px;color:#ffffff;letter-spacing:-2px;font-weight:900">EM</span><span style="font-family:'Arial Black',Impact,sans-serif;font-size:36px;color:#cccccc;letter-spacing:-1px;font-weight:900">R</span>
          <div style="color:#ffffff;font-size:10px;font-weight:600;letter-spacing:1.5px;margin-top:2px;opacity:0.9">TAP CHANGERS PVT. LTD.</div>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.5px">DAILY BRC STATUS REPORT</div>
          <div style="color:#ffffff;font-size:13px;margin-top:6px;font-weight:600;opacity:0.95">${today}</div>
        </td>
      </tr></table>
    </div>
    <div style="padding:24px 30px;border:1px solid #e0e0e0;border-top:none">
      <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:24px"><tr>
        <td style="background:#FFF3F4;border:1px solid #FFCDD2;border-radius:10px;text-align:center;width:33%">
          <div style="font-size:28px;font-weight:800;color:#BE1E2D">${pending.length}</div>
          <div style="font-size:11px;color:#BE1E2D;font-weight:700;text-transform:uppercase;letter-spacing:1px">Pending</div>
        </td>
        <td style="width:8px"></td>
        <td style="background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;text-align:center;width:33%">
          <div style="font-size:28px;font-weight:800;color:#F57F17">${materialItems.length}</div>
          <div style="font-size:11px;color:#F57F17;font-weight:700;text-transform:uppercase;letter-spacing:1px">Material Req</div>
        </td>
        <td style="width:8px"></td>
        <td style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:10px;text-align:center;width:33%">
          <div style="font-size:28px;font-weight:800;color:#2E7D32">${completeCount}</div>
          <div style="font-size:11px;color:#2E7D32;font-weight:700;text-transform:uppercase;letter-spacing:1px">Completed</div>
        </td>
      </tr></table>`;

  if (pending.length > 0) {
    html += `<div style="margin-bottom:24px">
      <div style="font-size:14px;font-weight:800;color:#BE1E2D;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #BE1E2D">&#9888; Pending Complaints (${pending.length})</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px">
        <tr style="background:#BE1E2D">
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">SR NO</th>
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">COMPANY</th>
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">LOCATION</th>
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">ISSUE</th>
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">ENGINEER</th>
        </tr>`;
    pending.forEach((c, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#fafafa';
      html += `<tr style="background:${bg}">
        <td style="padding:8px;border-bottom:1px solid #eee;color:#BE1E2D;font-weight:700;font-family:monospace;font-size:11px">${c.serialNo}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${c.companyName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#666">${c.location || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#333">${c.issueDescription}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#666">${c.engineerAssigned || '—'}</td>
      </tr>`;
    });
    html += `</table></div>`;
  }

  if (materialItems.length > 0) {
    html += `<div style="margin-bottom:24px">
      <div style="font-size:14px;font-weight:800;color:#F57F17;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #F57F17">&#128230; Material Requirements (${materialItems.length})</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px">
        <tr style="background:#F57F17">
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">SR NO</th>
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">COMPANY</th>
          <th style="padding:10px 8px;color:#fff;text-align:left;font-size:10px">MATERIAL REQUIRED</th>
        </tr>`;
    materialItems.forEach((c, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#FFFDE7';
      html += `<tr style="background:${bg}">
        <td style="padding:8px;border-bottom:1px solid #eee;color:#BE1E2D;font-weight:700;font-family:monospace;font-size:11px">${c.serialNo}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${c.companyName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#333;font-weight:500">${c.materialReq}</td>
      </tr>`;
    });
    html += `</table></div>`;
  }

  html += `
      <div style="margin-top:20px;padding-top:16px;border-top:2px solid #BE1E2D;text-align:center">
        <div style="font-size:12px;color:#BE1E2D;font-weight:700;letter-spacing:1px">EMR Tap Changers Private Limited</div>
        <div style="font-size:10px;color:#999;margin-top:4px">Formerly EASUN MR — Gujarat Service Division</div>
      </div>
    </div>
  </div>`;
  return html;
}

module.exports = async function handler(req, res) {
  try {
    // Load LIVE data from Google Sheets
    const complaints = await loadComplaints();
    
    const pending = complaints.filter(c => c.status === 'Pending');
    const materialItems = complaints.filter(c => c.status === 'Pending' && c.materialReq && c.materialReq.trim() !== '');
    const completeCount = complaints.filter(c => c.status === 'Complete').length;
    
    const now = new Date();
    const today = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
    const dateShort = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' });

    const htmlBody = generateEmailHTML(pending, materialItems, completeCount, today);
    const subject = `DAILY BRC STATUS REPORT (${dateShort})`;

    // CSV
    const csvHeaders = ["Serial No","Company","Location","Issue","Status","Engineer","Material Req"];
    const csvRows = [...pending, ...materialItems.filter(m => !pending.find(p => p.serialNo === m.serialNo))];
    const csv = [csvHeaders, ...csvRows.map(c => [c.serialNo, c.companyName, c.location, c.issueDescription, c.status, c.engineerAssigned, c.materialReq])].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    // Send via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"SRI VIGNESH — EMR Tap Changers" <${process.env.GMAIL_USER}>`,
      to: 'imsrivignesh@gmail.com',
      subject: subject,
      html: htmlBody,
      attachments: [{
        filename: `EMR_Pending_Report_${dateShort.replace(/\//g, '-')}.csv`,
        content: '\uFEFF' + csv,
        contentType: 'text/csv',
      }],
    });

    res.status(200).json({ 
      success: true, 
      message: `Email sent! Total: ${complaints.length}, Pending: ${pending.length}, Material: ${materialItems.length}`,
      source: 'Google Sheets (LIVE data)',
      time: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
