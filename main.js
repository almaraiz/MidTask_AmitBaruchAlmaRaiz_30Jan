const cardColors = ['#E1F5FE', '#FFF3E0', '#E8F5E9', '#F3E5F5', '#FFFDE7', '#FFEBEE', '#E0F7FA']; // מערך צבעים שמאפשר מחזוריות קבועה בכרטיסיות בלי להגדיר צבע לכל כרטיס בנפרד

const developmentStages = [ // מאגר נתונים מקומי שמאפשר לרנדר כרטיסיות בלי תלות בשרת/קריאה חיצונית
    { id: 1, title: "גילאי 1-3 חודשים: ההתחלה", description: "הרמת ראש בשכיבה על הבטן, מעקב במבט אחרי חפצים, הופעת החיוך החברתי והשמעת קולות ראשונים.", image: "assets/baby1.png" },
    { id: 2, title: "גילאי 4-6 חודשים: מתהפכים וטועמים", description: "התהפכות מהגב לבטן, הושטת ידיים לחפצים, והתחלת מתן תוסף ברזל וטעימות מזון ראשונות.", image: "assets/baby2.png" },
    { id: 3, title: "גילאי 6-9 חודשים: יושבים וזוחלים", description: "מעבר לישיבה עצמאית, זחילה (גחון או שש), הופעת 'חרדת זרים' והתחלת אכילה של מוצקים מגוונים.", image: "assets/baby3.png" },
    { id: 4, title: "גילאי 9-12 חודשים: לקראת עמידה", description: "עמידה בתמיכה, התפתחות 'אחיזת צבת' (אגודל ואצבע), הבנת הוראות פשוטות, ומילים ראשונות.", image: "assets/baby4.png" },
    { id: 5, title: "גילאי שנה עד שנה וחצי: צעדים ראשונים", description: "מעבר להליכה עצמאית, אכילה עצמאית בכפית, משחק פונקציונלי (האכלת בובה) והצבעה על רצונות.", image: "assets/baby5.png" },
    { id: 6, title: "גילאי שנה וחצי עד שנתיים: רצים ומדברים", description: "ריצה ללא נפילות, עלייה במדרגות, חיבור שתי מילים למשפט, ובניית מגדל מקוביות.", image: "assets/baby6.png" },
    { id: 7, title: "גילאי 3-6 שנים: עצמאות ומוטוריקה עדינה", description: "עצמאות בלבוש ובאכילה, ציור דמות אדם, קפיצה על רגל אחת, ומשחק חברתי עם קבוצת השווים.", image: "assets/baby7.png" }
];

let domElements = {}; // אובייקט מרכזי שמחזיק הפניות לאלמנטים כדי לא לחפש אותם מחדש בכל פעולה

function cacheDomElements() { // פונקציה שמרכזת את כל getElement/querySelector במקום אחד כדי לשפר סדר ותחזוקה
    domElements = {
        searchInput: document.getElementById('searchInput'),
        searchBtn: document.getElementById('searchBtn'),
        clearBtn: document.getElementById('clearBtn'),
        cardsContainer: document.getElementById('cardsContainer'),
        quizForm: document.getElementById('quizForm'),
        studentId: document.getElementById('studentId'),
        submitQuizBtn: document.getElementById('submitQuizBtn'),
        quizRadios: document.querySelectorAll('.quiz-radio'),
        successPopup: document.getElementById('successPopup'),
        successPopupLabel: document.getElementById('successPopupLabel'),
        successPopupMsg: document.getElementById('successPopupMsg'),
        header: document.querySelector('.main-header')
    };
}

document.addEventListener('DOMContentLoaded', () => { // נקודת התחלה שמבטיחה שה-DOM נטען לפני שאנחנו ניגשות לאלמנטים
    cacheDomElements();
    initScorm();
    setupEventListeners();
    adjustBodyPadding();
    renderCards(developmentStages);
    validateQuizForm();
});

function initScorm() { // אתחול SCORM רק אם האובייקט קיים כדי למנוע שגיאות בסביבה רגילה
    if (typeof scorm !== 'undefined') {
        scorm.init();
    }
}

function setupEventListeners() { // ריכוז כל מאזיני האירועים במקום אחד כדי שיהיה קל לעקוב ולתחזק
    if (domElements.searchBtn) domElements.searchBtn.addEventListener('click', filterContent);

    if (domElements.searchInput) {
        domElements.searchInput.addEventListener('input', toggleClearButton);
        domElements.searchInput.addEventListener('keydown', function (e) { // טיפול ב-Enter כדי למנוע שליחה לא רצויה ולקבע חיפוש
            if (e.key === 'Enter') {
                e.preventDefault();
                filterContent();
            }
        });
    }

    if (domElements.clearBtn) domElements.clearBtn.addEventListener('click', clearSearch);
    if (domElements.studentId) domElements.studentId.addEventListener('input', validateQuizForm);

    domElements.quizRadios.forEach(radio => radio.addEventListener('change', validateQuizForm)); // ניהול ולידציה משותפת לכל בחירה בבוחן

    if (domElements.submitQuizBtn) domElements.submitQuizBtn.addEventListener('click', checkQuiz);

    if (domElements.successPopup) {
        domElements.successPopup.addEventListener('hidden.bs.modal', function () { // איפוס טופס אחרי סגירת מודאל כדי לחזור למצב נקי
            if (domElements.quizForm) {
                domElements.quizForm.reset();
                domElements.studentId.classList.remove('is-valid', 'is-invalid');
                validateQuizForm();
            }
        });
    }

    window.addEventListener('resize', adjustBodyPadding); // התאמת padding כשגובה ה-header משתנה
    window.addEventListener('beforeunload', quitSCORM); // סגירת SCORM בצורה מסודרת בעת יציאה
}

function adjustBodyPadding() { // חישוב paddingTop לפי גובה header כדי למנוע כיסוי תוכן כש-header מקובע
    if (domElements.header) {
        document.body.style.paddingTop = domElements.header.offsetHeight + 'px';
    }
}

function filterContent() { // סינון נתונים לפי חיפוש והרצה חוזרת של רינדור
    const searchText = domElements.searchInput.value.trim().toLowerCase();
    const filteredData = developmentStages.filter(item =>
        item.title.toLowerCase().includes(searchText) ||
        item.description.toLowerCase().includes(searchText)
    );
    renderCards(filteredData, domElements.searchInput.value);
    toggleClearButton();
}

function renderCards(data, searchTerm = "") { // רינדור כרטיסיות מחדש לפי מערך נתונים שנשלח לפונקציה
    domElements.cardsContainer.innerHTML = '';

    if (data.length === 0) { // טיפול במצב שאין תוצאות כדי למנוע מסך ריק
        domElements.cardsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted fs-4">
                    לא נמצאו תוצאות מתאימות עבור ״<span class="fw-bold text-dark">${searchTerm}</span>״
                </p>
            </div>`;
        return;
    }

    data.forEach((item, index) => { // יצירת כרטיסיות ב-DOM מתוך הנתונים במקום לשמור HTML סטטי
        const bgColor = cardColors[index % cardColors.length];
        const cardCol = document.createElement('div');
        cardCol.className = 'col-lg-3 col-md-6 col-12';

        cardCol.innerHTML = `
            <div class="card h-100 border-0 shadow-sm hover-card overflow-hidden">
                <div class="card-img-wrapper p-3 text-center d-flex align-items-center justify-content-center"
                     style="background-color: ${bgColor};">
                    <img 
  src="${item.image}" 
  class="img-fluid" 
  alt="איור התפתחותי: ${item.title}" 
/>

                </div>
                <div class="card-body d-flex flex-column bg-white p-3">
                    <h5 class="card-title text-warning-dark fw-bold fs-6 mb-2">${item.title}</h5>
                    <p class="card-text text-muted small mb-3 flex-grow-1">${item.description}</p>
                    <button class="btn btn-outline-mint w-100 fw-bold rounded-pill btn-sm" type="button">למידע נוסף</button>
                </div>
            </div>
        `;
        domElements.cardsContainer.appendChild(cardCol);
    });
}

function toggleClearButton() { // הצגה/הסתרה של כפתור ניקוי בהתאם לאורך הטקסט
    if (domElements.searchInput.value.trim().length > 0) domElements.clearBtn.classList.remove('d-none');
    else domElements.clearBtn.classList.add('d-none');
}

function clearSearch() { // איפוס חיפוש והחזרת כל הכרטיסיות למצב התחלתי
    domElements.searchInput.value = '';
    renderCards(developmentStages);
    toggleClearButton();
    domElements.searchInput.focus();
}

function validateQuizForm() { // ולידציה מרוכזת שמפעילה/מכבה את כפתור השליחה ומעדכנת קלאסים
    let studentId = domElements.studentId.value;

    if (/[^0-9]/.test(studentId)) { // ניקוי תווים שאינם ספרות כדי לשמור נתון תקין
        studentId = studentId.replace(/[^0-9]/g, '');
        domElements.studentId.value = studentId;
    }

    const q1Answer = document.querySelector('input[name="q1"]:checked');
    const q2Answer = document.querySelector('input[name="q2"]:checked');

    if (studentId.length === 0) {
        domElements.studentId.classList.remove('is-valid', 'is-invalid');
    } else if (studentId.length === 9) {
        domElements.studentId.classList.add('is-valid');
        domElements.studentId.classList.remove('is-invalid');
    } else {
        domElements.studentId.classList.add('is-invalid');
        domElements.studentId.classList.remove('is-valid');
    }

    domElements.submitQuizBtn.disabled = !(studentId.length === 9 && q1Answer && q2Answer); // פתיחה של הכפתור רק כשהכול תקין
}

function calculateScore(q1Value, q2Value) { // פונקציה נפרדת לחישוב ציון כדי לשמור על checkQuiz נקייה וקצרה
    let score = 0;
    if (q1Value === '4months') score += 50;
    if (q2Value === '1year') score += 50;
    return score;
}

function showResultModal(ok) { // עדכון תוכן המודאל לפי הצלחת SCORM והצגה שלו בצורה מובנית
    if (!domElements.successPopup) return;

    if (ok) {
        domElements.successPopupLabel.classList.remove('text-danger');
        domElements.successPopupLabel.classList.add('text-success');
        domElements.successPopupLabel.textContent = "הבוחן נשלח בהצלחה!";
        domElements.successPopupMsg.textContent = "הציון ופרטיך דווחו למערכת הלמידה.";
    } else {
        domElements.successPopupLabel.classList.remove('text-success');
        domElements.successPopupLabel.classList.add('text-danger');
        domElements.successPopupLabel.textContent = "הבוחן נשמר, אך לא דווח למערכת";
        domElements.successPopupMsg.textContent = "נראה שהלומדה לא רצה בתוך מערכת SCORM או שהדיווח נכשל.";
    }

    const modal = new bootstrap.Modal(domElements.successPopup);
    modal.show();
}

function reportInteractions(studentId, q1Value, q2Value) { // דיווח אינטראקציות ל-SCORM במבנה קבוע כדי לאחד את הלוגיקה במקום אחד
    scorm.set("cmi.interactions.0.id", "Q1");
    scorm.set("cmi.interactions.0.type", "choice");
    scorm.set("cmi.interactions.0.student_response", q1Value);
    scorm.set("cmi.interactions.0.result", (q1Value === "4months") ? "correct" : "wrong");

    scorm.set("cmi.interactions.1.id", "Q2");
    scorm.set("cmi.interactions.1.type", "choice");
    scorm.set("cmi.interactions.1.student_response", q2Value);
    scorm.set("cmi.interactions.1.result", (q2Value === "1year") ? "correct" : "wrong");

    const payload = {
        studentId: studentId,
        q1: q1Value,
        q2: q2Value,
        submittedAt: new Date().toISOString()
    };
    scorm.set("cmi.suspend_data", JSON.stringify(payload));
}

function checkQuiz() { // פונקציה מרכזית שמבצעת בדיקה, חישוב, ודיווח ל-SCORM אם אפשר
    const q1Answer = document.querySelector('input[name="q1"]:checked');
    const q2Answer = document.querySelector('input[name="q2"]:checked');
    const studentId = domElements.studentId.value;

    if (!q1Answer || !q2Answer || studentId.length !== 9) return;

    const score = calculateScore(q1Answer.value, q2Answer.value);
    let scormOk = false;

    try {
        if (typeof scorm !== 'undefined' && scorm.isConnected && scorm.isConnected()) {
            scorm.setScore(score);
            reportInteractions(studentId, q1Answer.value, q2Answer.value);
            scorm.save();
            scorm.quit();
            scormOk = true;
        }
    } catch (e) {}

    showResultModal(scormOk);
}

function quitSCORM() { // סגירה בטוחה של SCORM בעת יציאה כדי לא להשאיר session פתוח
    try {
        if (typeof scorm !== 'undefined' && scorm.isConnected && scorm.isConnected()) {
            scorm.quit();
        }
    } catch (e) {}
}
