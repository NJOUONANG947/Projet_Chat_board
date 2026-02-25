# Quiz Checkbox Implementation Plan

## Task
Add checkbox/multiple-choice questions to the quiz system with immediate feedback (correct/wrong) when user answers.

## Changes Required

### 1. API - app/api/quiz/route.js
- [ ] Modify prompt to generate 4 multiple-choice options per question
- [ ] Add `options` array and `correct_answer` index to each question
- [ ] Ensure technical and general questions are included

### 2. Frontend - frontend/components/QuizViewer.js
- [ ] Add state for selected answer
- [ ] Display multiple choice options as radio buttons
- [ ] Show correct/wrong feedback immediately after selection
- [ ] Mark wrong answers with red X and correct with green checkmark
- [ ] Disable options after selection to prevent changing answer

## Implementation Details

### API Changes
Each question should have:
```json
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0,
  "suggested_answer": "Detailed explanation"
}
```

### Frontend Changes
- Show 4 radio button options for each question
- On selection: immediately show if correct (green) or wrong (red)
- If wrong: show correct answer highlighted
- Move to next question after showing feedback
