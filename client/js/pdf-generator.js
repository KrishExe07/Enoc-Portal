/**
 * PDF GENERATOR
 * Generates NOC PDF documents using jsPDF
 */

const pdfGenerator = {
    /**
     * Generate NOC PDF
     * @param {Object} nocData - NOC request data
     * @param {Object} companyData - Company data
     * @param {Object} studentData - Student data
     * @returns {Object} jsPDF instance
     */
    generateNOCPDF: function (nocData, companyData, studentData) {
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            portalUtils.showNotification('PDF library not loaded. Please refresh the page.', 'error');
            return null;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);

        // Colors
        const primaryColor = [14, 165, 233]; // Blue
        const darkColor = [31, 41, 55]; // Dark gray
        const lightColor = [107, 114, 128]; // Light gray

        // Header - University Logo and Name
        doc.setFillColor(240, 249, 255);
        doc.rect(0, 0, pageWidth, 50, 'F');

        // University Name
        doc.setFontSize(18);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('CHARUSAT UNIVERSITY', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.text('CHAROTAR UNIVERSITY OF SCIENCE & TECHNOLOGY', pageWidth / 2, 28, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(...lightColor);
        doc.text('Changa, Anand, Gujarat - 388421', pageWidth / 2, 36, { align: 'center' });

        // Decorative line
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, 45, pageWidth - margin, 45);

        // Document Title
        doc.setFontSize(16);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text('NO OBJECTION CERTIFICATE', pageWidth / 2, 60, { align: 'center' });

        // NOC ID and Date
        doc.setFontSize(9);
        doc.setTextColor(...lightColor);
        doc.setFont('helvetica', 'normal');
        const issueDate = this.formatDate(new Date());
        doc.text(`NOC ID: ${nocData.id}`, margin, 70);
        doc.text(`Date of Issue: ${issueDate}`, pageWidth - margin, 70, { align: 'right' });

        // Main Content
        let yPos = 85;
        doc.setFontSize(11);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');

        // To Whom It May Concern
        doc.setFont('helvetica', 'bold');
        doc.text('To Whom It May Concern,', margin, yPos);
        yPos += 12;

        // Body paragraph 1
        doc.setFont('helvetica', 'normal');
        const para1 = `This is to certify that ${studentData.name}, Student ID: ${studentData.id}, is a bonafide student of ${studentData.department || 'Computer Science'} department, currently enrolled in the ${this.getSemesterText(nocData.semester)} semester at CHARUSAT University.`;
        const para1Lines = doc.splitTextToSize(para1, contentWidth);
        doc.text(para1Lines, margin, yPos);
        yPos += (para1Lines.length * 6) + 8;

        // Body paragraph 2
        const para2 = `The university has no objection to ${this.getGenderPronoun(studentData.name)} undertaking an internship at ${companyData.name}, ${companyData.location} from ${this.formatDate(nocData.start_date)} to ${this.formatDate(nocData.end_date)}.`;
        const para2Lines = doc.splitTextToSize(para2, contentWidth);
        doc.text(para2Lines, margin, yPos);
        yPos += (para2Lines.length * 6) + 8;

        // Body paragraph 3
        const para3 = `We wish ${this.getGenderPronoun(studentData.name)} success in this endeavor and trust that this internship will provide valuable practical experience to complement ${this.getGenderPronoun(studentData.name, true)} academic learning.`;
        const para3Lines = doc.splitTextToSize(para3, contentWidth);
        doc.text(para3Lines, margin, yPos);
        yPos += (para3Lines.length * 6) + 15;

        // Company Details Box
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Company Details:', margin + 5, yPos + 8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);
        doc.setFontSize(9);
        doc.text(`Company: ${companyData.name}`, margin + 5, yPos + 15);
        doc.text(`Location: ${companyData.location}`, margin + 5, yPos + 21);
        doc.text(`HR Contact: ${companyData.hr_name} (${companyData.hr_email})`, margin + 5, yPos + 27);

        yPos += 45;

        // Closing
        doc.setFontSize(11);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Sincerely,', margin, yPos);
        yPos += 20;

        // Signature placeholder
        doc.setFont('helvetica', 'bold');
        doc.text('_______________________', margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.text('Dean / Head of Department', margin, yPos);
        yPos += 5;
        doc.text('CHARUSAT University', margin, yPos);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(...lightColor);
        doc.setFont('helvetica', 'italic');
        const footerY = pageHeight - 15;
        doc.text('This is a computer-generated document and does not require a physical signature.', pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Generated on: ${this.formatDateTime(new Date())}`, pageWidth / 2, footerY + 5, { align: 'center' });

        // Border
        doc.setDrawColor(...lightColor);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        return doc;
    },

    /**
     * Save and download PDF
     * @param {Object} doc - jsPDF instance
     * @param {string} filename - Filename for download
     */
    downloadPDF: function (doc, filename) {
        if (!doc) return;
        doc.save(filename);
    },

    /**
     * Format date to DD/MM/YYYY
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate: function (date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Format date and time
     * @param {Date} date - Date to format
     * @returns {string} Formatted date and time
     */
    formatDateTime: function (date) {
        const d = new Date(date);
        const dateStr = this.formatDate(d);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${dateStr} ${hours}:${minutes}`;
    },

    /**
     * Get semester text
     * @param {string} semester - Semester number (4, 6, 8)
     * @returns {string} Semester text
     */
    getSemesterText: function (semester) {
        const semesterMap = {
            '4': '4th',
            '6': '6th',
            '8': '8th'
        };
        return semesterMap[semester] || semester;
    },

    /**
     * Get gender pronoun based on name (simple heuristic)
     * @param {string} name - Student name
     * @param {boolean} possessive - Return possessive form
     * @returns {string} Pronoun
     */
    getGenderPronoun: function (name, possessive = false) {
        // Simple heuristic - in production, this should be from user profile
        // For now, use neutral pronouns
        return possessive ? 'their' : 'them';
    }
};

// Export for use in other scripts
window.pdfGenerator = pdfGenerator;
