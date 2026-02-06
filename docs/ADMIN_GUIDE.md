# CSO Self-Assessment Tool — Admin Guide

This guide is for **administrators** who manage the IGNITE CSOs Self-Assessment Tool: content (sections and questions), suggestions, organisations, other admins, and reports.

---

## 1. Accessing the admin area

### 1.1 Admin login

1. Open the Self-Assessment website (e.g. `https://selfassess.csogo.org`).  
2. Go to **Admin** (or **Admin Access** / **Admin Login**), or open the admin login URL directly (e.g. `/admin/login`).  
3. Enter your **admin email** and **password**.  
4. Click **Sign in** (or equivalent).  
5. You are taken to the **Admin dashboard**.

Only users who have been created as admins (by another admin or via a technical setup) can log in. If you need access, ask an existing administrator.

### 1.2 First-time admin setup

If you were **invited** by another admin:

1. You receive an email with an **invite link**.  
2. Open the link and complete the **Accept invite** or **Setup** page: set your **name** and **password**.  
3. After saving, you can log in at **Admin login** with your email and the password you set.

The first admin in the system is usually created by a technical person using a command-line script; see the technical handover document for details.

### 1.3 Logging out

Use **Sign out** or **Logout** in the admin area when you are done. Do not leave an admin session open on a shared or public computer.

---

## 2. Admin dashboard

The **Admin dashboard** is your main control panel. From here you can:

- **View organisations** — list of registered organisations, often with assessment counts.  
- **Manage sections and questions** — add, edit, reorder, or hide assessment sections and questions.  
- **Manage suggestions** — configure question-, section-, and assessment-level suggestions that appear in reports.  
- **Manage admins** — invite new admins or manage existing ones.  
- **View and download reports** — see aggregate statistics and download reports per organisation or in bulk.

Navigation may be via tabs, a sidebar, or links on the dashboard. Typical areas:

- **Dashboard** — overview.  
- **Sections / Questions** — content management (sometimes combined on one page).  
- **Suggestions** — suggestion rules.  
- **Organisations** — organisation list and actions.  
- **Admins** — admin user management.  
- **Reports** — reports and downloads.

---

## 3. Managing sections

Sections are the main categories of the assessment (e.g. Governance, Financial, Programme, HR).

### 3.1 Viewing sections

- Open **Sections** (or the section management area) from the dashboard.  
- You see a list of sections with **title**, **order**, and **weight** (how much the section counts toward the overall score).

### 3.2 Adding a section

1. Click **Add section** (or similar).  
2. Enter:
   - **Title** (e.g. “Governance”).  
   - **Description** (optional; shown to users).  
   - **Order** — number that defines the order of sections (e.g. 1, 2, 3).  
   - **Weight** — importance of this section in the overall score (e.g. 1.0).  
3. Save. The new section appears in the list and can be used for questions.

### 3.3 Editing a section

1. Find the section in the list.  
2. Click **Edit** (or the section name).  
3. Change title, description, order, or weight.  
4. Save.

### 3.4 Reordering sections

- Use **Reorder** or drag-and-drop if available.  
- Or edit each section and set the **Order** number so they appear in the order you want (e.g. 1, 2, 3, 4).

### 3.5 Deleting a section

- Use **Delete** (or equivalent) for the section.  
- **Warning:** Deleting a section can affect existing questions and responses. Prefer hiding or reordering unless you are sure.

---

## 4. Managing questions

Questions sit inside sections and define what organisations answer.

### 4.1 Viewing questions

- From the dashboard, open the **Questions** or **Sections** area.  
- You may see questions grouped by section. Each question shows **text**, **type**, **order**, and whether it’s **mandatory** or **hidden**.

### 4.2 Question types

When adding or editing a question you can choose:

- **Single choice** — one option (radio buttons).  
- **Multiple choice** — one or more options (checkboxes).  
- **Likert scale** — scale (e.g. 1–5).  
- **Text** — free text.  
- **Yes/No (Boolean)** — Yes or No.

### 4.3 Adding a question

1. Select the **section** the question belongs to (or click “Add question” within that section).  
2. Click **Add question** (or similar).  
3. Fill in:
   - **Question text** — what the user sees.  
   - **Description** (optional) — extra guidance.  
   - **Type** — single choice, multiple choice, Likert, text, or Yes/No.  
   - **Options** — for single/multiple choice or Likert, enter the options (e.g. one per line or comma-separated, depending on the UI).  
   - **Order** — position within the section.  
   - **Weight** — how much this question counts in the section score.  
   - **Mandatory** — whether the user must answer to complete.  
   - **Hidden** — if supported, hide from the form (e.g. for future use).  
4. Save.

### 4.4 Editing a question

1. Find the question (by section).  
2. Click **Edit**.  
3. Change any of the fields above.  
4. Save.

**Note:** Changing options or type for a question that already has responses can affect scoring and reports. Prefer small wording changes when possible.

### 4.5 Reordering questions

- Use **Reorder** or drag-and-drop within the section if available.  
- Or edit each question and set **Order** so they appear in the right sequence.

### 4.6 Deleting or hiding questions

- **Delete** removes the question; existing responses may be affected.  
- **Hidden** (if available) keeps the question in the system but hides it from the assessment form. Use this instead of deleting when you want to retire a question without losing data.

---

## 5. Managing suggestions

Suggestions are the recommendations that appear in organisation reports. They can be tied to:

- **Questions** — based on specific answer values (e.g. “If they answer ‘No’ here, show this suggestion”).  
- **Sections** — based on section scores (e.g. “If Governance score is between 40% and 70%, show this”).  
- **Assessment** — based on overall score or level (e.g. “If overall is Emerging, show this”).

### 5.1 Opening suggestions

- Go to **Suggestions** (or “Manage suggestions”) from the admin dashboard.  
- You may see tabs or lists for **Question**, **Section**, and **Assessment** suggestions.

### 5.2 Adding a suggestion

1. Choose the level: **Question**, **Section**, or **Assessment**.  
2. For **question**: select the question, then define the **condition** (e.g. “value equals …”) and the **suggestion text**.  
3. For **section**: select the section, define the **condition** (e.g. score range), and enter the **suggestion text**.  
4. For **assessment**: define the **condition** (e.g. overall score or level) and the **suggestion text**.  
5. Set **priority** (e.g. 1–10; higher = more important) and optionally **category** and **weight**.  
6. Save.

Conditions are often stored as simple rules (e.g. min/max score, or “value equals X”). The system uses these when generating reports after an assessment is completed.

### 5.3 Editing and activating/deactivating

- Use **Edit** to change the suggestion text, condition, or priority.  
- If there is an **Active** / **Inactive** toggle, use it to turn suggestions on or off without deleting them.

### 5.4 Tips

- Keep suggestion text short and actionable.  
- Use priority so the most important recommendations appear first in the report.  
- Test by completing a sample assessment and checking that the right suggestions appear.

---

## 6. Managing organisations

From the **Organisations** area you can:

- **View** all registered organisations (name, email, number of assessments, etc.).  
- **Search or filter** if the UI supports it.  
- **Open** an organisation to see its assessments and, where available, **reset password** or send a password reset email.

### 6.1 Organisation list

- The list typically shows organisation name, email, and assessment counts (e.g. total, completed).  
- Use this to see who is using the tool and who might need a reminder to complete an assessment.

### 6.2 Resetting an organisation’s password

If your interface has **Reset password** (or similar) for an organisation:

1. Select the organisation.  
2. Click **Reset password** (or “Send password reset”).  
3. Enter a new temporary password and/or trigger an email with a reset link, depending on how the system is configured.  
4. Inform the organisation (e.g. by phone or separate email) that their password was reset and how they can log in or set a new password.

---

## 7. Managing admins

From the **Admins** (or “Admin management”) area you can:

- **View** existing admin users.  
- **Invite** new admins by email.

### 7.1 Inviting a new admin

1. Click **Invite admin** (or similar).  
2. Enter the new admin’s **email address**.  
3. Send the invite. The system sends an email with an **invite link**.  
4. The new admin opens the link, sets their **name** and **password**, and can then log in at **Admin login**.

### 7.2 After inviting

- The new admin appears in the list (e.g. as “Invited” until they accept).  
- They do not need a pre-existing password; they set it when accepting the invite.

### 7.3 Removing or deactivating admins

If the UI allows removing or deactivating an admin, use that option with care — ensure at least one admin remains who can log in.

---

## 8. Reports

### 8.1 Reports overview

- Go to **Reports** from the admin dashboard.  
- You may see:
  - **Overview** — total organisations, total/completed assessments, completion rate, recent activity.  
  - **Charts** — e.g. section analysis, monthly activity, suggestion coverage.  
  - **Per-organisation reports** — list of organisations with links to their reports.

### 8.2 Viewing a specific organisation’s reports

1. Open **Reports** and find the organisation (e.g. by name or list).  
2. Click the organisation or “View reports”.  
3. You see that organisation’s completed assessments and can open each report.

### 8.3 Downloading reports

- **Single organisation:** From that organisation’s reports page, use **Download** (PDF or Excel) for the report(s) you need.  
- **All organisations / aggregate:** If available, use **Download all** or **Export** to get a bulk download (e.g. Excel).  
- Store and share downloaded files according to your data protection and confidentiality policies.

### 8.4 Using report data

- Use overview stats for programme reporting and monitoring.  
- Use per-organisation reports to support organisations or to check data quality.  
- Do not share organisation data with third parties without consent and a lawful basis.

---

## 9. Security and good practice

- **Keep your password strong and private.** Do not share admin credentials.  
- **Log out** when you finish, especially on shared computers.  
- **Invite only trusted people** as admins; they can change content and see all organisations and reports.  
- **Edit questions and sections carefully;** changes can affect existing responses and scoring.  
- **Back up or export important data** if your organisation’s policy requires it; use the report download and any export options provided.

---

## 10. Quick reference

| Task | Where to go | Action |
|------|-------------|--------|
| Log in | `/admin/login` | Email + password → Sign in |
| Add section | Dashboard → Sections | Add section → fill title, order, weight → Save |
| Add question | Dashboard → Sections/Questions | Select section → Add question → fill fields → Save |
| Edit question | Sections/Questions | Edit → change → Save |
| Add suggestion | Dashboard → Suggestions | Choose level (Question/Section/Assessment) → Add → condition + text → Save |
| Invite admin | Dashboard → Admins | Invite admin → enter email → Send |
| View organisations | Dashboard → Organisations | Browse list; use Reset password if needed |
| View reports | Dashboard → Reports | Overview or per-organisation; use Download as needed |

---

## 11. Getting technical help

- **Creating the first admin** (when no admin exists yet) is done via a command-line script — see the technical **HANDOVER.md** or **README.md**.  
- **Email (invites, verification)** — ensure SMTP is configured; see technical docs.  
- **Database, backups, deployment** — see **HANDOVER.md** and **deployment-guide.md**.

---

*This admin guide describes the typical behaviour of the CSO Self-Assessment Tool. Your installation may have slightly different labels or layout; the steps above should still apply in spirit.*
