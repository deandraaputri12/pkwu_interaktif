// Section Switching Logic
function showSection(sectionId) {
    console.log("Switching to section:", sectionId);
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update active nav link
    document.querySelectorAll('.nav-item').forEach(link => {
        const dataSection = link.getAttribute('data-section');
        if (dataSection === sectionId || (sectionId === 'materi-detail' && dataSection === 'materi')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // If section is progress, animate chart
    if (sectionId === 'progres') {
        initChart();
    }
}

// Materi Detail Functions
function showMateriDetail(id) {
    console.log("Showing materi detail for:", id);
    const data = materiData[id];
    if (data) {
        const body = document.getElementById('materi-body');
        if (body) {
            if (data.isSubMenu) {
                let html = `
                    <div class="materi-header" style="margin-bottom: 3rem;">
                        <h1 style="color: var(--primary); font-size: 2.5rem; margin-bottom: 1rem;">${data.title}</h1>
                        <p style="color: var(--text-muted);">Pilih sub-materi untuk mulai belajar.</p>
                    </div>
                    <div class="options-grid" style="margin-top: 2rem;">
                `;
                data.topics.forEach(topic => {
                    html += `
                        <div class="card sub-card" onclick="showSubMateri('${topic.id}')">
                            <i class="${topic.icon}"></i>
                            <h3>${topic.title}</h3>
                            <p>Klik untuk mempelajari lebih lanjut.</p>
                        </div>
                    `;
                });
                html += `</div>`;
                body.innerHTML = html;
            } else {
                body.innerHTML = data.content;
            }
            showSection('materi-detail');
        }
    }
}

function showSubMateri(subId) {
    console.log("Showing sub materi:", subId);
    const data = subMateriData[subId];
    if (data) {
        const body = document.getElementById('materi-body');
        if (body) {
            const parentId = subId.split('_')[0];
            body.innerHTML = `
                <button class="back-btn" onclick="showMateriDetail('${parentId}')"><i class="fas fa-arrow-left"></i> Kembali ke Daftar Sub-Materi</button>
                <div class="chart-container" style="padding: 3rem; text-align: left; background: var(--bg-card); animation: fadeIn 0.5s ease-out;">
                    ${data.content}
                </div>
            `;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Make functions global explicitly
window.showSection = showSection;
window.showMateriDetail = showMateriDetail;
window.showSubMateri = showSubMateri;

// Navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Initial Animation for Homepage
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease-out ${index * 0.1}s`;
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });

    updateDashboardStats();
});

// Chart.js Implementation
let myChart = null;

function getQuizHistory() {
    const history = localStorage.getItem('pkwu_quiz_history');
    return history ? JSON.parse(history) : [];
}

function saveQuizResult(score, total) {
    const history = getQuizHistory();
    const percentage = Math.round((score / total) * 100);
    const date = new Date().toLocaleDateString('id-ID', { weekday: 'short' });
    
    history.push({ score: percentage, date: date, timestamp: Date.now() });
    localStorage.setItem('pkwu_quiz_history', JSON.stringify(history.slice(-7))); // Keep last 7
    updateDashboardStats();
}

function updateDashboardStats() {
    const history = getQuizHistory();
    const avgScoreEl = document.getElementById('avg-score');
    const completedEl = document.getElementById('completed-modules');
    
    if (avgScoreEl && history.length > 0) {
        const total = history.reduce((sum, item) => sum + item.score, 0);
        const avg = Math.round(total / history.length);
        avgScoreEl.innerText = avg + '%';
    }

    if (completedEl) {
        // Mock module completion logic
        const completedCount = history.length > 0 ? Math.min(5, Math.ceil(history.length / 2)) : 0;
        completedEl.innerText = `${completedCount}/5`;
    }
}

function initChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();
    
    const history = getQuizHistory();
    // Default data if history is empty
    const labels = history.length > 0 ? history.map(h => h.date) : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const dataPoints = history.length > 0 ? history.map(h => h.score) : [0, 0, 0, 0, 0, 0, 0];

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Skor Kuis (%)',
                data: dataPoints,
                backgroundColor: gradient,
                borderColor: '#6366f1',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                }
            }
        }
    });
}

// Materi Content Data
const materiData = {
    'materi1': {
        title: 'Materi 1. Wirausaha',
        isSubMenu: true,
        topics: [
            { id: 'materi1_konsep', title: 'Konsep Wirausaha', icon: 'fas fa-book' },
            { id: 'materi1_tujuan', title: 'Tujuan Kewirausahaan', icon: 'fas fa-bullseye' },
            { id: 'materi1_manfaat', title: 'Manfaat Kewirausahaan', icon: 'fas fa-chart-line' },
            { id: 'materi1_perilaku', title: 'Konsep & Perilaku', icon: 'fas fa-brain' },
            { id: 'materi1_karakteristik', title: 'Karakteristik Wirausaha', icon: 'fas fa-user-check' },
            { id: 'materi1_hindari', title: 'Sikap yang Dihindari', icon: 'fas fa-exclamation-triangle' },
            { id: 'materi1_hasil_gagal', title: 'Keberhasilan & Kegagalan', icon: 'fas fa-trophy' }
        ]
    },
    'materi2': {
        title: 'Materi 2. Peluang Usaha',
        isSubMenu: true,
        topics: [
            { id: 'materi2_pengertian', title: 'Pengertian Peluang Usaha', icon: 'fas fa-lightbulb' },
            { id: 'materi2_analisis', title: 'Analisis Peluang Usaha', icon: 'fas fa-search' },
            { id: 'materi2_metode', title: 'Metode Analisis', icon: 'fas fa-project-diagram' }
        ]
    },
    'materi3': {
        title: 'Materi 3. Konsep Desain & Kemasan',
        isSubMenu: true,
        topics: [
            { id: 'materi3_mengenal', title: 'Mengenal Kemasan Produk', icon: 'fas fa-box' },
            { id: 'materi3_tujuan', title: 'Tujuan & Fungsi Desain', icon: 'fas fa-pencil-ruler' },
            { id: 'materi3_jenis', title: 'Jenis & Bentuk Kemasan', icon: 'fas fa-layer-group' }
        ]
    },
    'materi4': {
        title: 'Materi 4. Hak Kekayaan Intelektual',
        isSubMenu: true,
        topics: [
            { id: 'materi4_mengenal', title: 'Mengenal Apa Itu HKI', icon: 'fas fa-info-circle' },
            { id: 'materi4_tujuan', title: 'Tujuan HKI', icon: 'fas fa-bullseye' },
            { id: 'materi4_kebendaan', title: 'HKI Sebagai Hak Kebendaan', icon: 'fas fa-gavel' }
        ]
    },
    'materi5': {
        title: 'Materi 5. Pembuatan Prototipe',
        isSubMenu: true,
        topics: [
            { id: 'materi5_tahapan', title: 'Tahapan Pembuatan Prototipe', icon: 'fas fa-list-ol' },
            { id: 'materi5_faktor', title: 'Faktor yang Mempengaruhi', icon: 'fas fa-cogs' },
            { id: 'materi5_penting', title: 'Pentingnya Prototipe Produk', icon: 'fas fa-star' }
        ]
    }
};

const subMateriData = {
    'materi1_konsep': {
        title: 'Konsep Wirausaha',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">1. Konsep Wirausaha</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Wirausaha berasal dari perpaduan dua kata: <strong style="color: var(--text);">Wira</strong> yang berarti pejuang, pahlawan, manusia unggul, teladan, berbudi luhur, gagah berani dan berwatak agung; serta <strong style="color: var(--text);">Usaha</strong> yang berarti perbuatan amal, bekerja, berbuat sesuatu. Penggabungan kedua istilah ini menciptakan definisi sosok manusia yang unggul dalam melakukan suatu perbuatan produktif dengan semangat perjuangan yang tinggi.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Secara harfiah, wirausaha adalah orang yang berani mengambil risiko untuk membuka usaha dalam berbagai kesempatan. Namun secara esensial, wirausaha adalah mereka yang memiliki kemampuan untuk menciptakan nilai tambah melalui kreativitas dan inovasi guna memecahkan masalah pasar. Hal ini mencakup kemampuan untuk melihat peluang di mana orang lain melihat masalah, serta keberanian untuk mengeksekusi peluang tersebut menjadi entitas ekonomi yang bernilai.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Dalam konteks ekonomi modern, kewirausahaan tidak lagi hanya tentang membuka toko atau pabrik, tetapi tentang pola pikir (mindset). Seorang wirausaha adalah agen perubahan yang mendorong efisiensi ekonomi melalui pengenalan teknologi baru, penemuan sumber bahan baku baru, hingga pembukaan pasar baru yang belum pernah terjamah sebelumnya.</p>
            
            <div style="margin-top: 2rem; background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(99, 102, 241, 0.2);">
                <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Kewirausahaan (Entrepreneurship)</h4>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Adalah semangat, sikap, perilaku, dan kemampuan seseorang dalam menangani usaha atau kegiatan yang mengarah pada upaya mencari, menciptakan, serta menerapkan cara kerja, teknologi, dan produk baru dengan meningkatkan efisiensi dalam rangka memberikan pelayanan yang lebih baik dan atau memperoleh keuntungan yang lebih besar.</p>
            </div>
        `
    },
    'materi1_tujuan': {
        title: 'Tujuan Kewirausahaan',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">2. Tujuan Kewirausahaan</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Kewirausahaan memiliki peran vital dalam pembangunan ekonomi suatu bangsa. Tujuan utamanya bukan sekadar mencari keuntungan pribadi, melainkan menciptakan dampak sistemik yang positif bagi masyarakat luas. Dengan lahirnya wirausaha-wirausaha baru, rantai kemiskinan dapat diputus melalui pemberdayaan ekonomi lokal yang mandiri.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Selain itu, tujuan kewirausahaan adalah untuk melahirkan inovasi yang dapat meningkatkan kualitas hidup. Produk-produk yang lebih murah, lebih cepat, dan lebih efisien lahir dari kompetisi sehat antar wirausaha. Hal ini mendorong masyarakat untuk terus berkembang dan tidak terjebak dalam metode-metode konvensional yang sudah usang atau tidak produktif lagi.</p>
            <ul style="list-style: none; padding: 0;">
                <li style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-users-cog" style="color: var(--primary); margin-top: 0.3rem;"></i>
                    <div>
                        <strong style="display: block; margin-bottom: 0.2rem;">Meningkatkan Jumlah Wirausaha Berkualitas</strong>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Melahirkan bibit unggul yang mampu menciptakan lapangan kerja bagi diri sendiri dan orang lain melalui pelatihan dan pendampingan yang intensif.</p>
                    </div>
                </li>
                <li style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-hand-holding-heart" style="color: var(--primary); margin-top: 0.3rem;"></i>
                    <div>
                        <strong style="display: block; margin-bottom: 0.2rem;">Kesejahteraan Masyarakat</strong>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Mengurangi angka pengangguran secara signifikan dan meningkatkan pendapatan per kapita nasional melalui pajak dan konsumsi.</p>
                    </div>
                </li>
                <li style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-shield-alt" style="color: var(--primary); margin-top: 0.3rem;"></i>
                    <div>
                        <strong style="display: block; margin-bottom: 0.2rem;">Membudayakan Semangat Kewirausahaan</strong>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">Menanamkan mental tangguh, etos kerja tinggi, dan keberanian mengambil peluang terkalkulasi di kalangan generasi muda Indonesia.</p>
                    </div>
                </li>
            </ul>
        `
    },
    'materi1_manfaat': {
        title: 'Manfaat Kewirausahaan',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">3. Manfaat Kewirausahaan</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Manfaat kewirausahaan sangat luas, mulai dari skala personal hingga global. Secara individu, berwirausaha memberikan kebebasan dalam mengelola waktu dan potensi diri. Seseorang tidak lagi dibatasi oleh struktur birokrasi perusahaan, melainkan dapat mengeksplorasi ide-ide kreatifnya secara maksimal untuk mencapai aktualisasi diri yang setinggi-tingginya.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Secara sosial, wirausaha bertindak sebagai pahlawan ekonomi lokal. Mereka menyediakan penghasilan bagi keluarga-keluarga di sekitarnya dan membangun komunitas yang lebih stabil. Keberadaan unit usaha di suatu daerah akan memicu munculnya usaha-usaha pendukung lainnya, sehingga menciptakan ekosistem ekonomi yang saling menguntungkan (multiplier effect).</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-top: 3px solid var(--secondary);">
                    <h4 style="margin-bottom: 1rem;">Bagi Masyarakat</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">&bull; Membuka lapangan pekerjaan baru untuk berbagai jenjang keahlian.</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">&bull; Memenuhi kebutuhan harian melalui produk dan jasa yang inovatif.</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">&bull; Meningkatkan daya beli dan taraf hidup masyarakat sekitar.</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-top: 3px solid var(--primary);">
                    <h4 style="margin-bottom: 1rem;">Bagi Pembangunan</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">&bull; Sebagai generator utama pembangunan ekonomi nasional dan daerah.</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">&bull; Meningkatkan penerimaan pajak yang digunakan untuk fasilitas publik.</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">&bull; Mengurangi ketergantungan pada produk impor dan memperkuat devisa.</p>
                </div>
            </div>
            <p style="margin-top: 1.5rem; font-style: italic; color: var(--text-muted); font-size: 0.9rem;">Wirausaha juga memiliki peran edukatif dalam mendidik masyarakat agar hidup lebih efisien, hemat, disiplin, dan menghargai waktu sebagai aset paling berharga.</p>
        `
    },
    'materi1_perilaku': {
        title: 'Konsep dan Perilaku Wirausaha',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">4. Konsep dan Perilaku Wirausaha</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Seorang wirausaha sukses harus mengadopsi pola pikir tertentu yang membedakannya secara signifikan dari pekerja biasa atau manajer profesional. Perilaku wirausaha ditandai dengan proaktivitas tinggi, di mana mereka tidak hanya menunggu instruksi, melainkan aktif mencari tantangan dan solusi baru di tengah ketidakpastian pasar yang fluktuatif.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Etos kerja seorang wirausaha juga mencakup ketajaman insting dalam melihat celah keuntungan yang seringkali terabaikan oleh orang lain. Mereka memiliki orientasi masa depan yang sangat kuat, seringkali mengorbankan kesenangan jangka pendek (delayed gratification) demi membangun fondasi bisnis yang kokoh untuk pertumbuhan jangka panjang yang berkelanjutan.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Karakteristik 10 D (William Bygrave):</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.85rem;">
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>1. Dream:</strong> Memiliki visi masa depan yang jelas dan mampu mengartikulasikannya menjadi rencana kerja nyata.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>2. Decisiveness:</strong> Cepat mengambil keputusan kritis tanpa ragu-ragu namun tetap berlandaskan data yang valid.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>3. Doers:</strong> Menghindari penundaan; begitu keputusan diambil, eksekusi langsung dilakukan dengan penuh semangat.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>4. Determination:</strong> Memiliki tekad bulat dan komitmen total untuk mencapai sukses meski hambatan menghadang.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>5. Dedication:</strong> Mengabdikan seluruh energi dan pikiran tanpa batas untuk memajukan usaha yang dirintisnya.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>6. Devotion:</strong> Mencintai pekerjaan sepenuh hati; bisnis bagi mereka bukan beban, melainkan gairah hidup utama.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>7. Details:</strong> Memiliki perhatian yang sangat tajam pada aspek-aspek kecil yang menentukan kualitas layanan pelanggan.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>8. Destiny:</strong> Merasa bertanggung jawab penuh atas nasibnya sendiri tanpa menyalahkan keadaan atau orang lain.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>9. Dollars:</strong> Memandang keuntungan finansial sebagai indikator keberhasilan, bukan sekadar tujuan akhir yang egois.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 0.5rem;"><strong>10. Distribute:</strong> Berani membagikan tugas dan wewenang kepada orang lain untuk mempercepat skala pertumbuhan.</div>
            </div>
        `
    },
    'materi1_karakteristik': {
        title: 'Karakteristik Wirausaha',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">5. Karakteristik Wirausaha</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Karakteristik wirausaha adalah pondasi kepribadian yang memungkinkan seseorang bertahan di tengah badai krisis ekonomi. Tanpa karakteristik yang kuat, sebuah bisnis hanyalah sekumpulan aset yang tidak bernyawa. Karakteristik ini bukanlah bakat lahiriah semata, melainkan hasil dari tempaan pengalaman, pendidikan, dan kemauan keras untuk terus belajar dari kesalahan masa lalu.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Kejujuran dan integritas menempati posisi teratas dalam hierarki karakteristik sukses. Di dunia yang penuh dengan informasi instan, kepercayaan adalah mata uang yang paling berharga. Seorang wirausaha yang dikenal jujur akan lebih mudah mendapatkan modal dari investor, loyalitas dari karyawan, dan kepercayaan penuh dari pelanggan setia yang merasa aman bertransaksi dengannya.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain itu, kemandirian menjadi ciri khas yang tak terpisahkan. Wirausaha tidak mencari sandaran pada subsidi pemerintah atau bantuan orang lain, melainkan fokus pada penciptaan solusi yang bernilai ekonomi tinggi. Mereka adalah individu yang proaktif, berani mencoba hal baru, dan selalu haus akan pengetahuan demi meningkatkan standar kualitas hidup bagi diri mereka dan masyarakat luas.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                <div style="background: rgba(99, 102, 241, 0.1); padding: 1.5rem; border-radius: 1rem;">
                    <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Disiplin & Jujur</h4>
                    <p style="font-size: 0.85rem;">Membangun reputasi jangka panjang dan sistem kerja yang teratur tanpa pengawasan ketat.</p>
                </div>
                <div style="background: rgba(6, 182, 212, 0.1); padding: 1.5rem; border-radius: 1rem;">
                    <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">Mandiri & Kreatif</h4>
                    <p style="font-size: 0.85rem;">Mampu menghasilkan ide orisinal dan menjalankannya secara otonom dengan sumber daya terbatas.</p>
                </div>
                <div style="background: rgba(236, 72, 153, 0.1); padding: 1.5rem; border-radius: 1rem;">
                    <h4 style="color: var(--accent); margin-bottom: 0.5rem;">Berani Risiko</h4>
                    <p style="font-size: 0.85rem;">Menghadapi ketidakpastian dengan perhitungan matang (calculated risk) untuk meraih imbal hasil besar.</p>
                </div>
                <div style="background: rgba(34, 197, 94, 0.1); padding: 1.5rem; border-radius: 1rem;">
                    <h4 style="color: #22c55e; margin-bottom: 0.5rem;">Realistis</h4>
                    <p style="font-size: 0.85rem;">Menetapkan target yang ambisius namun tetap berlandaskan pada kemampuan data dan fakta di lapangan.</p>
                </div>
            </div>
        `
    },
    'materi1_hindari': {
        title: 'Sikap yang Harus Dihindari',
        content: `
            <h2 style="color: var(--accent); margin-bottom: 1.5rem;">6. Sikap yang Harus Dihindari</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Seringkali, musuh terbesar seorang wirausaha bukanlah pesaing yang kuat atau pasar yang lesu, melainkan sikap mental negatif yang berakar dari dalam diri sendiri. Sikap-sikap ini bagaikan racun yang perlahan membunuh kreativitas dan semangat juang, yang pada akhirnya akan menghancurkan potensi bisnis bahkan sebelum sempat berkembang besar.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Salah satu sikap paling mematikan adalah rasa cepat puas. Di era disrupsi teknologi saat ini, stagnasi berarti kemunduran. Wirausaha yang merasa sudah cukup dengan pencapaiannya saat ini cenderung akan berhenti berinovasi, sehingga sangat mudah disalip oleh pesaing baru yang lebih agresif dan adaptif terhadap perubahan selera konsumen yang sangat dinamis.</p>
            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 1.5rem; border-radius: 1rem;">
                <p style="margin-bottom: 1rem;"><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 0.5rem;"></i> <strong>Pesimis:</strong> Terlalu fokus pada kemungkinan kegagalan hingga lupa merencanakan langkah antisipasi yang produktif.</p>
                <p style="margin-bottom: 1rem;"><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 0.5rem;"></i> <strong>Malas:</strong> Memiliki visi besar tanpa eksekusi nyata; hanya menunggu peluang datang tanpa upaya menjemputnya secara aktif.</p>
                <p style="margin-bottom: 1rem;"><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 0.5rem;"></i> <strong>Boros:</strong> Mencampuradukkan keuangan pribadi dengan modal usaha, yang mengakibatkan krisis likuiditas pada operasional bisnis.</p>
                <p style="margin-bottom: 1rem;"><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 0.5rem;"></i> <strong>Gengsi:</strong> Takut terlihat rendah atau malu untuk berjualan langsung; sikap ini menghambat pemahaman mendalam tentang kebutuhan pelanggan.</p>
                <p><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 0.5rem;"></i> <strong>Mudah Menyerah:</strong> Menganggap kegagalan kecil sebagai akhir dari segalanya, bukannya melihatnya sebagai umpan balik berharga untuk perbaikan.</p>
            </div>
            <p style="line-height: 1.8; color: var(--text-muted); margin-top: 1.5rem;">Menghindari sikap-sikap di atas memerlukan kesadaran diri yang tinggi dan lingkungan pendukung yang positif agar mentalitas pemenang terus terjaga dalam setiap situasi sulit.</p>
        `
    },
    'materi1_hasil_gagal': {
        title: 'Keberhasilan dan Kegagalan',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">7. Keberhasilan dan Kegagalan</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Memahami faktor-faktor yang mendorong keberhasilan dan kegagalan adalah bentuk manajemen risiko yang sangat krusial. Keberhasilan dalam dunia wirausaha tidak pernah terjadi secara kebetulan atau hanya karena faktor keberuntungan semata. Ia adalah akumulasi dari perencanaan yang matang, disiplin yang konsisten, dan kemampuan untuk belajar secara cepat dari setiap tantangan yang muncul di setiap tahapan perkembangan bisnis.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Sebaliknya, kegagalan seringkali berakar pada kurangnya persiapan manajerial dan pemahaman yang dangkal terhadap dinamika pasar. Banyak wirausaha baru yang gagal karena terlalu optimis tanpa didukung oleh analisis keuangan yang realistis, atau karena mereka gagal merespons perubahan kebutuhan konsumen dengan cukup cepat. Kegagalan harus dipandang sebagai biaya sekolah yang mahal, bukan sebagai alasan untuk mengakhiri perjalanan kewirausahaan.</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div style="background: rgba(34, 197, 94, 0.03); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(34, 197, 94, 0.1);">
                    <h3 style="color: #22c55e; margin-bottom: 1rem;"><i class="fas fa-trophy"></i> Keberhasilan</h3>
                    <ul style="font-size: 0.9rem; line-height: 1.8; color: var(--text-muted);">
                        <li>Visi strategis dan misi operasional yang terukur secara jelas.</li>
                        <li>Manajemen waktu yang sangat disiplin dan produktif.</li>
                        <li>Mampu beradaptasi secara gesit dengan perkembangan teknologi.</li>
                        <li>Orientasi yang sangat kuat pada kepuasan dan loyalitas pelanggan.</li>
                        <li>Kemampuan membangun tim yang solid, kompeten, dan harmonis.</li>
                    </ul>
                </div>
                <div style="background: rgba(239, 68, 68, 0.03); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(239, 68, 68, 0.1);">
                    <h3 style="color: #ef4444; margin-bottom: 1rem;"><i class="fas fa-exclamation-triangle"></i> Kegagalan</h3>
                    <ul style="font-size: 0.9rem; line-height: 1.8; color: var(--text-muted);">
                        <li>Kurangnya pengalaman manajerial dan kepemimpinan yang efektif.</li>
                        <li>Pemilihan lokasi usaha yang tidak strategis dan sulit dijangkau pasar.</li>
                        <li>Perencanaan keuangan yang buruk serta pengawasan modal yang lemah.</li>
                        <li>Kurangnya riset pasar yang mendalam (produk tidak sesuai kebutuhan).</li>
                        <li>Penggunaan modal usaha secara serampangan untuk gaya hidup konsumtif.</li>
                    </ul>
                </div>
            </div>
            <p style="line-height: 1.8; color: var(--text-muted); margin-top: 2rem;">Wirausaha yang tangguh akan menjadikan setiap kegagalan sebagai batu loncatan untuk mencapai keberhasilan yang lebih besar di masa depan melalui evaluasi dan perbaikan yang jujur terhadap sistem bisnis mereka.</p>
        `
    },
    'materi2_pengertian': {
        title: 'Pengertian Peluang Usaha',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">1. Pengertian Peluang Usaha</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Peluang usaha adalah kesempatan atau waktu yang tepat yang seharusnya diambil oleh seorang wirausaha untuk mendapatkan keuntungan dengan cara mendirikan bisnis atau mengembangkan yang sudah ada. Keberadaan peluang seringkali tidak terlihat secara kasat mata; ia memerlukan ketajaman analisis dan kepekaan terhadap perubahan lingkungan sekitar untuk dapat diidentifikasi sebagai potensi ekonomi yang nyata.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Sebuah peluang yang baik haruslah memenuhi kriteria kelayakan pasar, teknis, dan finansial. Tidak semua ide kreatif adalah peluang usaha yang bagus. Seorang wirausaha harus mampu membedakan antara tren sesaat yang cepat hilang (fad) dengan kebutuhan pasar jangka panjang yang berkelanjutan. Hal ini memerlukan riset awal yang objektif sebelum memutuskan untuk mengalokasikan sumber daya yang berharga.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain itu, peluang usaha juga sangat dipengaruhi oleh kesiapan internal sang wirausaha. Peluang emas di tangan orang yang salah mungkin akan berujung pada kegagalan, sementara ide sederhana di tangan eksekutor yang hebat dapat berubah menjadi kerajaan bisnis yang besar. Oleh karena itu, pemilihan peluang haruslah selaras dengan kompetensi inti dan gairah (passion) pribadi agar dapat dijalankan dengan penuh dedikasi.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Sumber Peluang Usaha:</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 0.8rem; border: 1px solid rgba(255,255,255,0.05);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">Internal</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Hobi yang ditekuni secara profesional, keahlian teknis khusus, pengalaman kerja di industri tertentu, atau latar belakang pendidikan yang relevan.</p>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 0.8rem; border: 1px solid rgba(255,255,255,0.05);">
                    <h4 style="margin-bottom: 0.5rem; color: var(--secondary);">Eksternal</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Perubahan tren gaya hidup, masalah sosial yang belum terpecahkan, kemajuan teknologi digital, atau perubahan regulasi pemerintah.</p>
                </div>
            </div>

            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Jenis-Jenis Usaha Berdasarkan Sektor:</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-left: 4px solid var(--primary);">
                    <h4 style="margin-bottom: 0.5rem;">Usaha Jasa</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Menjual keahlian atau tenaga tanpa perpindahan kepemilikan barang fisik secara dominan. <br>Contoh: Konsultan SEO, Barber Shop, Laundry, dan Pendidikan.</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-left: 4px solid var(--secondary);">
                    <h4 style="margin-bottom: 0.5rem;">Usaha Dagang</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Kegiatan utama adalah membeli barang jadi dari produsen dan menjualnya kembali ke konsumen akhir. <br>Contoh: Toko gadget, Fashion, dan Minimarket.</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-left: 4px solid var(--accent);">
                    <h4 style="margin-bottom: 0.5rem;">Usaha Produksi</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Mengolah bahan baku mentah menjadi produk setengah jadi atau barang jadi yang memiliki nilai tambah. <br>Contoh: Pabrik roti, Konveksi, dan Kerajinan.</p>
                </div>
            </div>
        `
    },
    'materi2_analisis': {
        title: 'Analisis Peluang Usaha',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">2. Analisis Peluang Usaha</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Sebelum mengeksekusi sebuah ide menjadi unit bisnis nyata, wirausaha wajib melakukan analisis kelayakan yang mendalam. Analisis ini berfungsi sebagai peta navigasi untuk menghindari jebakan-jebakan kerugian yang sering muncul akibat optimisme yang buta. Tanpa analisis yang kuat, seorang pengusaha hanya melakukan perjudian nasib, bukan menjalankan strategi bisnis yang terukur.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Metode analisis yang paling umum dan sangat efektif adalah SWOT. Dengan membedah aspek internal (Kekuatan & Kelemahan) dan eksternal (Peluang & Ancaman), kita dapat melihat gambaran besar posisi bisnis kita di tengah persaingan pasar. Hasil dari analisis ini harus digunakan untuk memperkuat keunggulan kompetitif dan memitigasi risiko-risiko yang mungkin menghambat pertumbuhan di masa depan.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain SWOT, analisis pasar juga mencakup pemahaman tentang demografi target konsumen, daya beli masyarakat, serta kekuatan pesaing langsung maupun tidak langsung. Pemetaan ini memungkinkan kita untuk menentukan strategi pemasaran yang tepat sasaran dan efisien dalam penggunaan anggaran promosi yang terbatas pada tahap awal pembangunan bisnis.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Analisis SWOT Secara Mendalam:</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                <div style="background: rgba(34, 197, 94, 0.05); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(34, 197, 94, 0.2);">
                    <h4 style="color: #22c55e;">S - Strengths (Kekuatan)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Faktor internal positif yang memberikan keunggulan kompetitif. Apa kelebihan unik Anda? (Misal: Resep rahasia, lisensi eksklusif, atau lokasi strategis).</p>
                </div>
                <div style="background: rgba(239, 68, 68, 0.05); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(239, 68, 68, 0.2);">
                    <h4 style="color: #ef4444;">W - Weaknesses (Kelemahan)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Keterbatasan internal yang perlu diperbaiki agar tidak menghambat kemajuan. (Misal: Keterbatasan modal, kurangnya tenaga ahli, atau peralatan lama).</p>
                </div>
                <div style="background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(99, 102, 241, 0.2);">
                    <h4 style="color: var(--primary);">O - Opportunities (Peluang)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Faktor eksternal yang bisa dimanfaatkan untuk ekspansi. (Misal: Munculnya platform digital baru, perubahan selera pasar, atau subsidi pemerintah).</p>
                </div>
                <div style="background: rgba(234, 179, 8, 0.05); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(234, 179, 8, 0.2);">
                    <h4 style="color: #eab308;">T - Threats (Ancaman)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Tantangan eksternal yang dapat membahayakan kelangsungan usaha. (Misal: Pesaing harga murah, inflasi bahan baku, atau perubahan regulasi mendadak).</p>
                </div>
            </div>

            <div style="margin-top: 2rem; background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem;">
                <h4 style="color: var(--secondary); margin-bottom: 0.5rem;">Ciri Peluang Usaha yang Bernilai Tinggi:</h4>
                <p style="font-size: 0.9rem; line-height: 1.8;">&bull; <strong>Orisinil:</strong> Memiliki keunikan yang sulit ditiru secara identik oleh kompetitor.<br>&bull; <strong>Visible:</strong> Memiliki kelayakan finansial dan model bisnis yang masuk akal.<br>&bull; <strong>Scalable:</strong> Berpotensi untuk dikembangkan menjadi lebih besar di masa depan.<br>&bull; <strong>Passion-driven:</strong> Sesuai dengan minat agar tahan banting saat menghadapi masa sulit.</p>
            </div>
        `
    },
    'materi3_mengenal': {
        title: 'Mengenal Kemasan Produk',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">1. Mengenal Kemasan Produk</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Kemasan produk bukan sekadar pembungkus atau pelindung fisik, melainkan sebuah sistem yang terintegrasi dan terkoordinasi untuk menyiapkan barang agar siap didistribusikan, disimpan, dijual, hingga digunakan oleh konsumen akhir. Dalam dunia industri modern, kemasan dianggap sebagai bagian tak terpisahkan dari produk itu sendiri, yang berfungsi sebagai perisai terhadap kontaminasi lingkungan dan kerusakan mekanis selama proses logistik yang panjang.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Selain aspek teknis, kemasan juga memegang peranan krusial dalam psikologi pemasaran. Ia sering disebut sebagai "silent salesman" karena mampu mengomunikasikan nilai merek dan manfaat produk tanpa kata-kata melalui elemen visualnya. Kemasan yang dirancang dengan baik dapat menciptakan ikatan emosional pertama dengan pembeli, yang sangat menentukan keputusan pembelian di rak-rak supermarket yang penuh sesak dengan berbagai pilihan serupa.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Perkembangan teknologi kemasan saat ini juga mulai bergeser ke arah keberlanjutan (sustainability). Wirausaha kini dituntut untuk memikirkan siklus hidup kemasan setelah digunakan agar tidak menjadi beban lingkungan. Penggunaan material bioplastik, kertas daur ulang, atau desain kemasan yang dapat digunakan kembali (reusable) menjadi nilai tambah yang sangat dihargai oleh segmen konsumen sadar lingkungan (eco-conscious consumers).</p>
            
            <div style="background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem;">
                <h3 style="color: var(--secondary); margin-bottom: 1rem;">Persyaratan Kemasan yang Profesional:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 1rem;"><i class="fas fa-check-circle" style="color: var(--primary); margin-right: 0.5rem;"></i> <strong>Efektivitas:</strong> Ukuran dan bentuk material harus sesuai dengan sifat kimia dan fisik produk.</li>
                    <li style="margin-bottom: 1rem;"><i class="fas fa-check-circle" style="color: var(--primary); margin-right: 0.5rem;"></i> <strong>Keamanan (Food Grade):</strong> Tidak mengandung zat berbahaya yang dapat bermigrasi ke dalam produk.</li>
                    <li style="margin-bottom: 1rem;"><i class="fas fa-check-circle" style="color: var(--primary); margin-right: 0.5rem;"></i> <strong>Kemudahan (Convenience):</strong> Desain ergonomis yang memudahkan konsumen saat membuka, menuang, atau menyimpan kembali.</li>
                    <li style="margin-bottom: 1rem;"><i class="fas fa-check-circle" style="color: var(--primary); margin-right: 0.5rem;"></i> <strong>Ekonomis:</strong> Biaya produksi kemasan harus efisien agar tidak melambungkan harga jual produk secara berlebihan.</li>
                </ul>
            </div>

            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Material Kemasan yang Umum Digunakan:</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 0.5rem;"><strong>Plastik:</strong> Sangat fleksibel dan murah, namun memerlukan teknologi daur ulang yang tepat agar tidak mencemari laut.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 0.5rem;"><strong>Kertas/Karton:</strong> Ramah lingkungan dan memiliki permukaan yang sangat baik untuk pencetakan desain grafis resolusi tinggi.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 0.5rem;"><strong>Logam/Aluminium:</strong> Memberikan perlindungan total terhadap cahaya dan oksigen, sangat cocok untuk produk kalengan jangka panjang.</div>
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 0.5rem;"><strong>Gelas:</strong> Bersifat netral dan tidak bereaksi dengan isi, memberikan kesan premium namun memerlukan penanganan ekstra karena rapuh.</div>
            </div>
        `
    },
    'materi3_tujuan': {
        title: 'Tujuan dan Fungsi Desain Kemasan',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">2. Tujuan dan Fungsi Desain Kemasan</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Desain kemasan yang sukses harus mampu menyeimbangkan aspek teknis perlindungan produk dengan aspek estetika pemasaran. Tujuan utamanya adalah memastikan produk sampai ke tangan konsumen dalam kondisi kualitas terbaik (grade A) sekaligus memberikan pengalaman membuka (unboxing experience) yang memuaskan. Kemasan yang fungsional tanpa nilai desain akan gagal menarik perhatian, sementara desain yang indah tanpa kekuatan perlindungan akan merugikan bisnis akibat kerusakan barang.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Selain itu, desain kemasan juga berfungsi sebagai media edukasi dan transparansi perusahaan terhadap pelanggan. Melalui label yang tertera, konsumen dapat mengetahui apa yang mereka konsumsi atau gunakan secara detail. Hal ini membangun kejujuran merek yang sangat penting dalam jangka panjang. Desain juga harus mempertimbangkan efisiensi ruang penyimpanan di gudang dan rak toko agar biaya logistik dapat ditekan serendah mungkin.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Terakhir, fungsi desain kemasan adalah untuk membedakan identitas (differentiation). Di tengah pasar yang homogen, kemasan yang unik secara visual atau memiliki mekanisme penggunaan yang berbeda akan lebih mudah diingat oleh masyarakat. Inovasi dalam bentuk dan mekanisme kemasan seringkali menjadi kunci utama dalam memenangkan persaingan pasar yang sangat ketat.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <div style="background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 1rem; border-top: 4px solid var(--primary);">
                    <h4 style="margin-bottom: 0.5rem;">Fungsi Protektif</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Mencegah kerusakan akibat benturan fisik, gesekan logistik, serta faktor alam seperti radiasi sinar UV, kelembapan udara, dan oksigen yang mempercepat proses oksidasi.</p>
                </div>
                <div style="background: rgba(6, 182, 212, 0.05); padding: 1.5rem; border-radius: 1rem; border-top: 4px solid var(--secondary);">
                    <h4 style="margin-bottom: 0.5rem;">Fungsi Informasi & Legalitas</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Menyantumkan label wajib sesuai regulasi: Nama Produk, Izin BPOM/PIRT, Label Halal, Kode Produksi, Tanggal Kadaluarsa, dan Komposisi Bahan secara jujur.</p>
                </div>
                <div style="background: rgba(236, 72, 153, 0.05); padding: 1.5rem; border-radius: 1rem; border-top: 4px solid var(--accent);">
                    <h4 style="margin-bottom: 0.5rem;">Fungsi Promosi & Branding</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Kemasan harus mampu mengomunikasikan kepribadian merek melalui perpaduan warna, grafis, dan tipografi yang memikat psikologi calon pembeli secara instan.</p>
                </div>
            </div>
        `
    },
    'materi3_jenis': {
        title: 'Jenis Barang dan Bentuk Kemasan',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">3. Jenis Barang dan Bentuk Kemasan</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Pemilihan bentuk dan struktur kemasan harus disesuaikan dengan karakteristik fisik dan kimia produk yang dikemas. Produk cair memerlukan wadah yang kedap bocor dan stabil, sementara produk padat mungkin lebih memerlukan perlindungan terhadap tekanan mekanis. Memahami hirarki kemasan sangat penting bagi wirausaha untuk merancang strategi distribusi yang efisien dan aman hingga ke pelanggan jarak jauh.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Selain hirarki struktur, sifat kekakuan material juga menentukan bagaimana produk akan dipasarkan dan disimpan. Kemasan fleksibel kini menjadi tren karena ringan dan menghemat ruang, namun kemasan kaku tetap diperlukan untuk produk-produk yang memerlukan perlindungan maksimal terhadap oksigen dan kelembapan tinggi. Kombinasi yang tepat antar jenis kemasan ini akan menciptakan perlindungan berlapis yang menjamin mutu produk tetap terjaga.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Klasifikasi Berdasarkan Hirarki Struktur:</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 0.8rem; text-align: center;">
                    <i class="fas fa-box" style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.5rem;"></i>
                    <h5 style="margin-bottom: 0.3rem;">Primer</h5>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Wadah yang bersentuhan langsung dengan produk (Botol, sachet, kaleng).</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 0.8rem; text-align: center;">
                    <i class="fas fa-boxes" style="font-size: 1.5rem; color: var(--secondary); margin-bottom: 0.5rem;"></i>
                    <h5 style="margin-bottom: 0.3rem;">Sekunder</h5>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Kemasan luar untuk melindungi kumpulan kemasan primer (Kardus isi 12).</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 0.8rem; text-align: center;">
                    <i class="fas fa-truck-loading" style="font-size: 1.5rem; color: var(--accent); margin-bottom: 0.5rem;"></i>
                    <h5 style="margin-bottom: 0.3rem;">Tersier</h5>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Kemasan untuk pengiriman masal dan penyimpanan gudang (Palet kayu, kontainer).</p>
                </div>
            </div>

            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Klasifikasi Berdasarkan Sifat Kekakuan:</h3>
            <ul style="list-style: none; padding: 0; font-size: 0.9rem;">
                <li style="margin-bottom: 1rem;">&bull; <strong>Kemasan Fleksibel:</strong> Terbuat dari bahan yang mudah dilenturkan mengikuti bentuk produk (Plastik lembaran, kertas, foil). Sangat hemat biaya logistik.</li>
                <li style="margin-bottom: 1rem;">&bull; <strong>Kemasan Kaku:</strong> Terbuat dari bahan keras yang tidak bisa dibengkokkan tanpa merusaknya (Botol gelas, kaleng logam). Memberikan proteksi fisik tertinggi.</li>
                <li style="margin-bottom: 1rem;">&bull; <strong>Kemasan Semi-Kaku:</strong> Memiliki sifat fleksibilitas terbatas namun dapat kembali ke bentuk semula (Botol plastik PET, wadah styrofoam).</li>
            </ul>
        `
    },
    'materi4_mengenal': {
        title: 'Mengenal Apa Itu HKI',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">1. Mengenal Apa Itu HKI</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;"><strong>Hak Kekayaan Intelektual (HKI)</strong> adalah hak eksklusif yang timbul dari hasil olah pikir manusia yang menghasilkan suatu produk atau proses yang memiliki kegunaan nyata bagi kehidupan. Di era ekonomi kreatif saat ini, HKI bukan lagi sekadar formalitas hukum, melainkan aset strategis yang melindungi keunikan intelektual agar tidak dieksploitasi secara ilegal oleh pihak lain yang tidak bertanggung jawab.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Perlindungan HKI memberikan insentif moral dan finansial bagi para inovator dan pencipta untuk terus berkarya. Tanpa jaminan perlindungan, seseorang akan merasa enggan untuk membagikan penemuannya ke publik karena takut idenya dicuri atau dipalsukan. Oleh karena itu, pendaftaran HKI secara resmi melalui Direktorat Jenderal Kekayaan Intelektual (DJKI) merupakan langkah wajib bagi setiap wirausaha yang ingin mengamankan identitas bisnisnya di pasar nasional maupun internasional.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Secara filosofis, HKI menyeimbangkan antara kepentingan pribadi pencipta untuk mendapatkan imbalan ekonomi dengan kepentingan masyarakat untuk mendapatkan akses terhadap kemajuan teknologi dan seni. Negara memberikan hak monopoli terbatas kepada pencipta selama jangka waktu tertentu, dengan syarat penemuan tersebut harus didaftarkan dan dijelaskan secara transparan kepada publik.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1.2rem;">Dua Pilar Utama Klasifikasi HKI:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div style="background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 1rem; border-left: 4px solid var(--primary);">
                    <h4 style="margin-bottom: 0.5rem;">Hak Cipta (Copyright)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Melindungi karya orisinal di bidang ilmu pengetahuan, seni, dan sastra. Perlindungan ini berlaku secara otomatis sejak karya diwujudkan dalam bentuk nyata tanpa wajib pendaftaran (deklaratif).</p>
                </div>
                <div style="background: rgba(6, 182, 212, 0.05); padding: 1.5rem; border-radius: 1rem; border-left: 4px solid var(--secondary);">
                    <h4 style="margin-bottom: 0.5rem;">Hak Kekayaan Industri</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Meliputi hak-hak yang memerlukan pendaftaran resmi untuk perlindungan hukumnya, seperti Paten (Inovasi), Merek (Logo/Nama), Desain Industri (Estetika), dan Rahasia Dagang.</p>
                </div>
            </div>
            <p style="margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted);">Memahami perbedaan mendasar ini sangat penting agar wirausaha tidak salah dalam mengajukan jenis perlindungan yang sesuai dengan aset intelektual yang mereka miliki.</p>
        `
    },
    'materi4_tujuan': {
        title: 'Tujuan HKI',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">2. Tujuan HKI</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Implementasi sistem perlindungan HKI memiliki tujuan multidimensi yang mendukung kemajuan sebuah peradaban. Secara hukum, HKI bertujuan untuk menciptakan kepastian dan ketertiban dalam dunia usaha. Dengan adanya sistem yang transparan, wirausaha memiliki pegangan hukum yang kuat untuk menuntut ganti rugi jika karya mereka dipalsukan, sehingga meminimalkan potensi konflik bisnis yang merugikan.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Secara ekonomi, HKI bertujuan untuk meningkatkan daya saing industri nasional di kancah global. Merek yang terlindungi dengan baik akan memiliki nilai jual (brand equity) yang tinggi, yang dapat dijadikan aset untuk mendapatkan pendanaan atau kerja sama waralaba (franchise). Hal ini mendorong perputaran modal yang sehat dan memicu lahirnya perusahaan-perusahaan raksasa baru berbasis inovasi intelektual.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain itu, HKI juga bertujuan untuk memperkaya khazanah ilmu pengetahuan manusia. Karena setiap penemuan yang dipatenkan harus dipublikasikan secara mendetail (disclosure), maka ilmuwan lain dapat mempelajari penemuan tersebut untuk kemudian dikembangkan lebih lanjut menjadi inovasi baru setelah masa perlindungan berakhir. Ini menciptakan estafet kemajuan teknologi yang berkelanjutan bagi umat manusia.</p>
            <ul style="list-style: none; padding: 0;">
                <li style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: var(--primary); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">1</div>
                    <div>
                        <h4 style="color: var(--secondary)">Kepastian & Perlindungan Hukum</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">Memberikan alat bukti kepemilikan yang sah di pengadilan untuk menghentikan tindakan pembajakan atau peniruan yang merugikan.</p>
                    </div>
                </li>
                <li style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: var(--primary); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">2</div>
                    <div>
                        <h4 style="color: var(--secondary)">Peningkatan Valuasi Aset</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">Merek atau paten terdaftar adalah aset berharga yang dapat meningkatkan nilai jual perusahaan di mata investor dan perbankan.</p>
                    </div>
                </li>
                <li style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: var(--primary); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">3</div>
                    <div>
                        <h4 style="color: var(--secondary)">Inovasi Berkelanjutan</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">Memotivasi individu untuk terus bereksperimen menciptakan solusi baru tanpa khawatir karyanya akan dieksploitasi cuma-cuma.</p>
                    </div>
                </li>
            </ul>
        `
    },
    'materi4_kebendaan': {
        title: 'HKI Sebagai Hak Kebendaan',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">3. HKI Sebagai Hak Kebendaan</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">HKI dikategorikan sebagai <strong>intangible property</strong> (benda tak berwujud) yang memiliki kedudukan hukum setara dengan benda berwujud lainnya seperti tanah, rumah, atau kendaraan. Meskipun kita tidak bisa menyentuh fisik sebuah "Paten" atau "Merek", namun secara hukum hak tersebut memiliki nilai ekonomi yang nyata dan dilindungi sepenuhnya oleh negara sebagai bagian dari kekayaan pribadi atau korporasi.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Sebagai hak kebendaan, HKI memberikan otoritas penuh kepada pemiliknya untuk mengeksploitasi hak tersebut, melarang orang lain untuk menggunakannya tanpa izin, serta memberikan lisensi kepada pihak ketiga. Hal ini berarti HKI dapat dijadikan objek transaksi komersial yang sangat menguntungkan, termasuk dapat diwariskan kepada ahli waris jika pemilik asli telah meninggal dunia, atau dipindahtangankan melalui kontrak jual beli.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain itu, di Indonesia, sertifikat HKI kini dapat digunakan sebagai jaminan (fidusia) untuk mengajukan pinjaman ke perbankan atau lembaga keuangan lainnya. Hal ini merupakan terobosan besar bagi para pelaku UMKM dan industri kreatif untuk mendapatkan modal tambahan hanya dengan bermodalkan kekayaan intelektual yang mereka miliki dan telah terdaftar secara resmi.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1.2rem;">Karakteristik Kebendaan pada HKI:</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-bottom: 4px solid var(--accent);">
                    <i class="fas fa-exchange-alt" style="margin-bottom: 1rem; color: var(--accent);"></i>
                    <h4>Dapat Dialihkan</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Kepemilikan hak dapat berpindah tangan melalui proses Warisan, Hibah, Wasiat, atau Perjanjian Jual Beli yang sah secara hukum.</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-bottom: 4px solid var(--secondary);">
                    <i class="fas fa-file-contract" style="margin-bottom: 1rem; color: var(--secondary);"></i>
                    <h4>Pemberian Lisensi</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Pemilik dapat memberikan izin "sewa" kepada pihak lain untuk menggunakan karyanya dengan imbalan pembayaran Royalti yang disepakati.</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-bottom: 4px solid var(--primary);">
                    <i class="fas fa-clock" style="margin-bottom: 1rem; color: var(--primary);"></i>
                    <h4>Jangka Waktu Perlindungan</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Memiliki batas waktu tertentu (Paten 20 th, Merek 10 th dapat diperpanjang) sebelum hak tersebut menjadi milik umum (public domain).</p>
                </div>
            </div>
        `
    },
    'materi5_proses': {
        title: 'Proses Kerja Pembuatan Prototipe',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">1. Proses Kerja Pembuatan Prototipe</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Pembuatan prototipe adalah fase transisi yang sangat krusial di mana ide abstrak diubah menjadi wujud fisik yang dapat diuji. Proses ini memungkinkan wirausaha untuk memvisualisasikan fungsi dan bentuk produk secara nyata sebelum masuk ke tahap produksi massal yang berisiko tinggi. Dengan prototipe, kita dapat mendeteksi kesalahan desain lebih awal, sehingga menghemat biaya perbaikan yang jauh lebih mahal jika kesalahan baru ditemukan setelah ribuan unit produk selesai diproduksi.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Dalam praktiknya, pembuatan prototipe harus dilakukan secara bertahap, mulai dari model kasar (low-fidelity) hingga model yang mendekati produk akhir (high-fidelity). Setiap iterasi prototipe memberikan umpan balik berharga tentang ergonomi, kekuatan material, dan estetika visual. Hal ini memastikan bahwa produk akhir nantinya benar-benar selaras dengan ekspektasi konsumen dan standar kualitas industri yang berlaku.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain aspek teknis, proses ini juga berfungsi sebagai alat komunikasi yang ampuh untuk menarik minat investor atau mitra bisnis. Melihat dan menyentuh prototipe fisik memberikan keyakinan jauh lebih besar daripada sekadar melihat presentasi digital. Oleh karena itu, kualitas pengerjaan prototipe seringkali menjadi penentu apakah sebuah proyek bisnis akan mendapatkan dukungan pendanaan lebih lanjut atau terhenti di tengah jalan.</p>
            
            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Manfaat Strategis Prototipe:</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-top: 3px solid var(--primary);">
                    <h4 style="margin-bottom: 0.5rem;">Uji Coba & Validasi</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Memastikan semua fitur berfungsi sesuai rencana dan aman digunakan oleh konsumen dalam berbagai kondisi operasional.</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 1rem; border-top: 3px solid var(--secondary);">
                    <h4 style="margin-bottom: 0.5rem;">Efisiensi Biaya</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Menghindari pemborosan material akibat kegagalan produksi massal yang disebabkan oleh cacat desain yang tidak terdeteksi sebelumnya.</p>
                </div>
            </div>

            <h3 style="color: var(--secondary); margin-bottom: 1rem;">Alur Kerja (Design Thinking Workflow):</h3>
            <div style="position: relative; padding-left: 2rem; border-left: 2px solid var(--primary);">
                <div style="margin-bottom: 1.5rem;">
                    <div style="position: absolute; left: -0.6rem; width: 1.2rem; height: 1.2rem; background: var(--primary); border-radius: 50%;"></div>
                    <strong style="color: var(--text);">1. Empathize & Define:</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Memahami masalah pengguna dan menentukan spesifikasi teknis yang harus dipenuhi oleh produk.</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <div style="position: absolute; left: -0.6rem; width: 1.2rem; height: 1.2rem; background: var(--primary); border-radius: 50%;"></div>
                    <strong style="color: var(--text);">2. Ideate:</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Menciptakan berbagai alternatif solusi desain dalam bentuk sketsa kasar atau model 3D sederhana.</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <div style="position: absolute; left: -0.6rem; width: 1.2rem; height: 1.2rem; background: var(--primary); border-radius: 50%;"></div>
                    <strong style="color: var(--text);">3. Prototype:</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Mewujudkan ide terbaik menjadi model fisik menggunakan material yang representatif (kayu, plastik, atau logam).</p>
                </div>
                <div>
                    <div style="position: absolute; left: -0.6rem; width: 1.2rem; height: 1.2rem; background: var(--primary); border-radius: 50%;"></div>
                    <strong style="color: var(--text);">4. Test:</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Melakukan uji coba penggunaan langsung oleh calon pengguna dan mengumpulkan feedback untuk penyempurnaan.</p>
                </div>
            </div>
        `
    },
    'materi5_faktor': {
        title: 'Faktor-faktor yang Mempengaruhi',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">2. Faktor-faktor yang Mempengaruhi</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Keberhasilan pembuatan prototipe sangat bergantung pada keseimbangan antara ketersediaan sumber daya dan target kualitas yang ingin dicapai. Salah satu faktor utama adalah kapabilitas fasilitas produksi. Wirausaha harus realistis dalam menilai apakah peralatan yang dimiliki mampu menghasilkan prototipe dengan presisi yang dibutuhkan, atau apakah perlu melakukan outsourcing ke laboratorium prototipe profesional yang memiliki teknologi cetak 3D atau CNC lebih canggih.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Faktor manusia juga memegang peranan vital dalam proses ini. Tim yang mengerjakan prototipe harus memiliki keahlian multidisiplin, mulai dari pemahaman material hingga estetika desain industri. Tanpa koordinasi yang baik antar anggota tim, prototipe yang dihasilkan mungkin hanya akan unggul di satu sisi (misal: estetika) namun gagal total di sisi fungsionalitas teknis, yang pada akhirnya akan menghambat proses validasi produk secara keseluruhan.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain itu, standar tanggung jawab produk (product liability) dan kepatuhan terhadap regulasi (seperti SNI di Indonesia) harus mulai dipertimbangkan sejak tahap prototipe. Mendesain produk yang tidak memenuhi standar keamanan nasional sejak awal akan berujung pada penolakan sertifikasi saat produk siap diluncurkan, yang berarti pemborosan waktu dan biaya pengembangan yang sangat besar.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 1rem; border-bottom: 4px solid #22c55e;">
                    <h4 style="margin-bottom: 0.5rem; color: #22c55e;">Fungsi Produk</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Kemampuan komponen produk untuk bekerja secara harmonis tanpa gangguan teknis di bawah tekanan operasional normal.</p>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 1rem; border-bottom: 4px solid #eab308;">
                    <h4 style="margin-bottom: 0.5rem; color: #eab308;">Kapasitas Fasilitas</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Menyesuaikan desain dengan kemampuan mesin produksi dan tenaga ahli yang dimiliki perusahaan agar tidak terjadi over-budget.</p>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 1rem; border-bottom: 4px solid #ef4444;">
                    <h4 style="margin-bottom: 0.5rem; color: #ef4444;">Ergonomi & Safety</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Kenyamanan interaksi antara manusia dan produk, memastikan desain tidak menyebabkan kelelahan atau cedera saat digunakan.</p>
                </div>
            </div>
        `
    },
    'materi5_penting': {
        title: 'Pentingnya Prototipe Produk',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">3. Pentingnya Prototipe Produk</h2>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.2rem;">Pentingnya prototipe dalam siklus hidup produk tidak dapat diremehkan karena ia berfungsi sebagai jembatan antara konsep teoretis dan realitas pasar. Banyak kegagalan bisnis besar bermula dari pengabaian fase prototipe yang memadai, di mana produk langsung dilempar ke pasar tanpa pengujian lapangan yang mendalam. Prototipe memberikan bukti empiris bahwa solusi yang ditawarkan memang dapat bekerja secara teknis dan diterima secara estetika oleh target market.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 1.5rem;">Secara manajerial, prototipe membantu tim untuk menyatukan visi dan mengurangi ambiguitas dalam pengembangan produk. Dengan adanya model fisik, perdebatan tentang fitur atau bentuk dapat diselesaikan dengan data nyata hasil uji coba, bukan sekadar opini subjektif. Hal ini menciptakan budaya kerja yang berbasis pada performa (performance-based) dan meningkatkan efisiensi kerja tim secara keseluruhan dalam jangka panjang.</p>
            <p style="line-height: 1.8; color: var(--text-muted); margin-bottom: 2rem;">Selain itu, prototipe juga memiliki peran vital dalam strategi perlindungan HKI dan sertifikasi. Gambar teknik yang dihasilkan dari prototipe yang sukses dapat dijadikan dasar pendaftaran desain industri atau paten. Memiliki prototipe yang sudah teruji memberikan keunggulan kompetitif bagi wirausaha untuk mengklaim keunikan produk mereka sebelum kompetitor menyadari peluang yang sama di pasar.</p>
            
            <div style="background: rgba(34, 197, 94, 0.05); padding: 2rem; border-radius: 1rem; border: 1px dashed #22c55e;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h4 style="color: #22c55e; margin-bottom: 0.5rem;">Manfaat Teknis</h4>
                        <ul style="font-size: 0.85rem; line-height: 1.8; color: var(--text-muted);">
                            <li>Menemukan cacat desain tersembunyi lebih awal.</li>
                            <li>Mengukur presisi dimensi produk secara akurat.</li>
                            <li>Memilih material yang paling efisien & tahan lama.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style="color: #22c55e; margin-bottom: 0.5rem;">Manfaat Bisnis</h4>
                        <ul style="font-size: 0.85rem; line-height: 1.8; color: var(--text-muted);">
                            <li>Meningkatkan kepercayaan investor potensial.</li>
                            <li>Bahan riset pasar (Product-Market Fit).</li>
                            <li>Mempercepat waktu peluncuran (Time to Market).</li>
                        </ul>
                    </div>
                </div>
            </div>
            <p style="line-height: 1.8; color: var(--text-muted); margin-top: 1.5rem;">Kesimpulannya, prototipe bukan sekadar biaya tambahan, melainkan investasi strategis yang menentukan hidup atau matinya sebuah inovasi produk di pasar yang kompetitif.</p>
        `
    },
    'materi2_metode': {
        title: 'Metode Analisis Peluang Usaha',
        content: `
            <h2 style="color: var(--primary); margin-bottom: 1.5rem;">3. Metode Analisis Peluang Usaha</h2>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--secondary); margin-bottom: 1rem;">Metode SWOT</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Analisis terhadap <strong>Strengths</strong> (Kekuatan), <strong>Weaknesses</strong> (Kelemahan), <strong>Opportunities</strong> (Peluang), dan <strong>Threats</strong> (Ancaman).</p>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--secondary); margin-bottom: 1rem;">Metode Mind Mapping</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Memetakan ide secara visual melalui cabang-cabang pikiran untuk melihat gambaran besar dari sebuah peluang bisnis.</p>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="color: var(--secondary); margin-bottom: 1rem;">Metode 5W + 1H</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Menganalisis peluang dengan pertanyaan: <strong>What</strong> (Apa usahanya), <strong>Where</strong> (Dimana), <strong>When</strong> (Kapan), <strong>Who</strong> (Siapa pasarnya), <strong>Why</strong> (Kenapa layak), dan <strong>How</strong> (Bagaimana menjalankannya).</p>
            </div>
        `
    }
};

// Quiz Logic & Data
const quizQuestions = [
    {
        question: "Berasal dari kata 'Wira' dan 'Usaha', apa arti harfiah dari kata 'Wira'?",
        options: ["Pekerja keras", "Pejuang atau Pahlawan", "Pencari modal", "Pemilik modal"],
        answer: 1
    },
    {
        question: "Manakah di bawah ini yang merupakan salah satu dari 10D karakteristik wirausaha menurut William Bygrave?",
        options: ["Doubt", "Decisiveness", "Difficulty", "Danger"],
        answer: 1
    },
    {
        question: "Seorang wirausaha yang mencintai pekerjaannya dan sangat berdedikasi tinggi termasuk dalam karakteristik 10D yang disebut...",
        options: ["Dollars", "Destiny", "Devotion", "Distribute"],
        answer: 2
    },
    {
        question: "Faktor utama yang seringkali menyebabkan kegagalan usaha baru adalah...",
        options: ["Lokasi yang terlalu luas", "Kurangnya riset pasar dan persiapan manajerial", "Terlalu banyak karyawan", "Modal yang terlalu besar"],
        answer: 1
    },
    {
        question: "Peluang usaha yang berasal dari diri sendiri (faktor internal) contohnya adalah...",
        options: ["Perubahan regulasi pemerintah", "Hobi atau keahlian khusus", "Masalah sosial di masyarakat", "Perkembangan teknologi digital"],
        answer: 1
    },
    {
        question: "Dalam analisis SWOT, faktor eksternal yang dapat dimanfaatkan untuk mengembangkan bisnis disebut...",
        options: ["Strengths", "Weaknesses", "Opportunities", "Threats"],
        answer: 2
    },
    {
        question: "Metode analisis 5W+1H yang menanyakan tentang target konsumen atau pasar yang dituju adalah...",
        options: ["What", "Where", "Who", "Why"],
        answer: 2
    },
    {
        question: "Usaha yang kegiatan utamanya adalah menjual keahlian atau tenaga tanpa perpindahan kepemilikan fisik disebut...",
        options: ["Usaha Dagang", "Usaha Jasa", "Usaha Produksi", "Usaha Manufaktur"],
        answer: 1
    },
    {
        question: "Mengapa kemasan sering disebut sebagai 'Silent Salesman'?",
        options: ["Karena kemasan tidak bisa berbicara", "Karena mampu menarik pembeli melalui desain visualnya", "Karena harganya murah", "Karena melindungi produk dari benturan"],
        answer: 1
    },
    {
        question: "Manakah label yang wajib dicantumkan pada kemasan produk makanan di Indonesia?",
        options: ["Izin BPOM dan Label Halal", "Warna favorit produsen", "Nama pemilik perusahaan", "Alamat rumah karyawan"],
        answer: 0
    },
    {
        question: "Kemasan yang bersentuhan langsung dengan produk disebut sebagai kemasan...",
        options: ["Sekunder", "Tersier", "Primer", "Kuartener"],
        answer: 2
    },
    {
        question: "Material kemasan yang memberikan perlindungan total terhadap cahaya dan oksigen adalah...",
        options: ["Plastik bening", "Kertas karton", "Aluminium/Logam", "Gelas bening"],
        answer: 2
    },
    {
        question: "Hak eksklusif yang melindungi karya di bidang seni, sastra, dan ilmu pengetahuan adalah...",
        options: ["Paten", "Merek", "Hak Cipta", "Desain Industri"],
        answer: 2
    },
    {
        question: "HKI dianggap sebagai 'Intangible Property', yang artinya...",
        options: ["Benda berwujud", "Benda tak berwujud", "Benda yang mudah rusak", "Benda yang tidak bernilai"],
        answer: 1
    },
    {
        question: "Berapa lama jangka waktu perlindungan untuk Hak Paten biasa di Indonesia?",
        options: ["10 Tahun", "20 Tahun", "50 Tahun", "Seumur hidup"],
        answer: 1
    },
    {
        question: "Kepemilikan HKI dapat dialihkan kepada pihak lain melalui...",
        options: ["Lisan saja", "Mimpi", "Warisan atau Perjanjian Tertulis", "Pinjaman tanpa surat"],
        answer: 2
    },
    {
        question: "Tahap pertama dalam Design Thinking untuk pembuatan prototipe adalah...",
        options: ["Ideate", "Define", "Empathize", "Prototype"],
        answer: 2
    },
    {
        question: "Apa fungsi utama dari pembuatan prototipe sebelum produksi massal?",
        options: ["Mencari keuntungan awal", "Mendeteksi kesalahan desain lebih dini", "Memperindah tampilan toko", "Menghabiskan anggaran sisa"],
        answer: 1
    },
    {
        question: "Standar keamanan produk di Indonesia yang harus dipenuhi sejak tahap prototipe adalah...",
        options: ["ISO 9001", "PIRT", "SNI", "Halal"],
        answer: 2
    },
    {
        question: "Iterasi dalam pembuatan prototipe dilakukan berdasarkan...",
        options: ["Insting semata", "Feedback atau umpan balik pengguna", "Warna yang sedang tren", "Harga bahan baku"],
        answer: 1
    }
];

let currentQuestion = 0;
let score = 0;
let userAnswers = [];

function startQuiz() {
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    renderQuiz();
}

function renderQuiz() {
    const quizRoot = document.getElementById('quiz-root');
    const question = quizQuestions[currentQuestion];
    
    const progress = ((currentQuestion) / quizQuestions.length) * 100;

    quizRoot.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-header">
                <h3>Kuis Interaktif PKWU</h3>
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" style="width: ${progress}%"></div>
                </div>
                <p>Pertanyaan ${currentQuestion + 1} dari ${quizQuestions.length}</p>
            </div>
            
            <div class="question-card animate-fade-in">
                <h4>${question.question}</h4>
                <div class="options-grid">
                    ${question.options.map((option, index) => `
                        <button class="option-btn" onclick="handleSelectOption(${index})">
                            <span class="option-label">${String.fromCharCode(65 + index)}</span>
                            ${option}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function handleSelectOption(selectedIndex) {
    userAnswers.push(selectedIndex);
    if (selectedIndex === quizQuestions[currentQuestion].answer) {
        score++;
    }

    if (currentQuestion < quizQuestions.length - 1) {
        currentQuestion++;
        renderQuiz();
    } else {
        showQuizResults();
    }
}

function showQuizResults() {
    const quizRoot = document.getElementById('quiz-root');
    const percentage = (score / quizQuestions.length) * 100;
    let message = "";
    let color = "";

    if (percentage >= 80) {
        message = "Luar Biasa! Anda sudah menguasai materi dengan sangat baik.";
        color = "#22c55e";
    } else if (percentage >= 60) {
        message = "Bagus! Terus tingkatkan pemahaman Anda.";
        color = "#eab308";
    } else {
        message = "Jangan menyerah! Pelajari lagi materi dan coba lagi.";
        color = "#ef4444";
    }

    saveQuizResult(score, quizQuestions.length);
    
    quizRoot.innerHTML = `
        <div class="quiz-results-card animate-fade-in">
            <div class="result-icon" style="color: ${color}">
                <i class="fas ${percentage >= 60 ? 'fa-medal' : 'fa-book-open'}"></i>
            </div>
            <h2>Hasil Kuis Anda</h2>
            <div class="score-display">
                <span class="score-number" style="color: ${color}">${percentage}%</span>
                <p>Skor Anda: ${score} / ${quizQuestions.length}</p>
            </div>
            <p class="result-message">${message}</p>
            <div class="result-actions">
                <button class="primary-btn" style="padding: 1rem 2rem; border-radius: 0.5rem; background: var(--primary); color: white; border: none; cursor: pointer; font-weight: 600;" onclick="startQuiz()">Coba Lagi</button>
                <button class="secondary-btn" style="padding: 1rem 2rem; border-radius: 0.5rem; border: 1px solid var(--border-color); cursor: pointer;" onclick="showSection('materi')">Kembali ke Materi</button>
            </div>
        </div>
    `;
}

// Make functions global
window.startQuiz = startQuiz;
window.handleSelectOption = handleSelectOption;
