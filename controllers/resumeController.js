const pool = require('../db');
const { parsePdf, analyzeResume } = require('../services/analysisService');

async function uploadResume(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Parse PDF
    const resumeText = await parsePdf(req.file.buffer);

    // Analyze via LLM
    const data = await analyzeResume(resumeText);

    // Persist to DB
    const query = `
      INSERT INTO resumes (
        file_name, name, email, phone, linkedin_url, portfolio_url, summary,
        work_experience, education, technical_skills, soft_skills, projects,
        certifications, resume_rating, improvement_areas, upskill_suggestions
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *;
    `;

    const values = [
      req.file.originalname,
      data.name,
      data.email,
      data.phone,
      data.linkedin_url,
      data.portfolio_url,
      data.summary,
      JSON.stringify(data.work_experience || []),
      JSON.stringify(data.education || []),
      JSON.stringify(data.technical_skills || []),
      JSON.stringify(data.soft_skills || []),
      JSON.stringify(data.projects || []),
      JSON.stringify(data.certifications || []),
      Number.isInteger(data.resume_rating) ? data.resume_rating : null,
      data.improvement_areas || null,
      JSON.stringify(data.upskill_suggestions || []),
    ];

    const saved = await pool.query(query, values);
    return res.status(201).json(saved.rows[0]);
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to analyze or save resume' });
  }
}

async function getAllResumes(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, file_name, name, email, uploaded_at
       FROM resumes
       ORDER BY uploaded_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch all error:', err);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
}

async function getResumeById(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM resumes WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch by id error:', err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
}

module.exports = { uploadResume, getAllResumes, getResumeById };
