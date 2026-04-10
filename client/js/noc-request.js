/**
 * NOC REQUEST FORM JAVASCRIPT (API VERSION)
 * Handles 3-step NOC request workflow with backend API
 */

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    const currentUser = portalUtils.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        portalUtils.showNotification('Please login as a student to access this page', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // Set user name in header
    document.getElementById('userName').textContent = currentUser.name;

    // Initialize form
    let currentStep = 1;
    let selectedCompany = null;
    let isNewCompany = false;
    let formData = {};
    let companiesCache = [];
    let derivedStudentId = null;

    initializeForm();

    // Load companies and setup event listeners
    loadCompanies();
    setupEventListeners();

    /**
     * Initialize form with user data
     */
    function initializeForm() {
        const studentIdInput = document.getElementById('studentId');
        const studentNameInput = document.getElementById('studentName');
        const collegeEmailInput = document.getElementById('collegeEmail');

        // Keep student ID immutable in UI.
        studentIdInput.readOnly = true;

        // Auto-fill name and email from authenticated profile.
        studentNameInput.value = currentUser.name || '';
        collegeEmailInput.value = currentUser.email || '';

        // Use the enrollment number saved in backend (from login), or derive from email.
        // currentUser.studentId is the full ID like "24IT068" returned by auth route.
        const parsedStudentId =
            currentUser.studentId ||
            extractStudentIdFromEmail(currentUser.email || '');

        if (!parsedStudentId) {
            studentIdInput.value = '';
            derivedStudentId = null;
            portalUtils.showNotification(
                'Invalid college email format. Expected YYBRANCH###@charusat.edu.in (example: 24IT068@charusat.edu.in).',
                'error'
            );
            return;
        }

        derivedStudentId = parsedStudentId;  // full string like "24IT068"
        studentIdInput.value = parsedStudentId;
    }

    /**
     * Extract full student enrollment ID from CHARUSAT student email.
     * Matches the local-part of emails like:
     *   24IT068@charusat.edu.in       → "24IT068"
     *   22cs015@it.charusat.edu.in    → "22CS015"
     * Returns null for non-matching or non-CHARUSAT emails.
     */
    function extractStudentIdFromEmail(email) {
        if (!email || typeof email !== 'string') return null;
        const match = email.trim().match(
            /^([0-9]{2}[A-Za-z]+[0-9]{3})@(?:[A-Za-z0-9-]+\.)*charusat\.edu\.in$/i
        );
        return match ? match[1].toUpperCase() : null;
    }

    /**
     * Load companies into dropdown
     */
    async function loadCompanies() {
        const companySelect = document.getElementById('companySelect');

        try {
            // Fetch companies from backend API
            const response = await apiService.getCompanies();

            if (response.success) {
                companiesCache = response.companies;

                // Clear existing options except first
                companySelect.innerHTML = '<option value="">-- Select Company --</option>';

                // Add companies
                companiesCache.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = company.name;
                    companySelect.appendChild(option);
                });

                // Add "Other" option
                const otherOption = document.createElement('option');
                otherOption.value = 'other';
                otherOption.textContent = 'Other Company';
                companySelect.appendChild(otherOption);
            } else {
                portalUtils.showNotification('Failed to load companies', 'error');
            }
        } catch (error) {
            console.error('Error loading companies:', error);
            portalUtils.showNotification('Error loading companies. Please refresh the page.', 'error');
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Company selection change
        document.getElementById('companySelect').addEventListener('change', handleCompanySelection);

        // Navigation buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => nextStep());
        });

        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => prevStep());
        });

        // Form submission
        document.getElementById('nocRequestForm').addEventListener('submit', handleFormSubmit);

        // Date validation
        document.getElementById('startDate').addEventListener('change', validateDates);
        document.getElementById('endDate').addEventListener('change', validateDates);
    }

    /**
     * Handle company selection
     */
    function handleCompanySelection(e) {
        const companyId = e.target.value;
        const step1NextBtn = document.getElementById('step1NextBtn');

        if (!companyId) {
            // No selection
            document.getElementById('companyDetailsDisplay').style.display = 'none';
            document.getElementById('newCompanyForm').style.display = 'none';
            step1NextBtn.disabled = true;
            selectedCompany = null;
            isNewCompany = false;
            return;
        }

        if (companyId === 'other') {
            // Show new company form
            document.getElementById('companyDetailsDisplay').style.display = 'none';
            document.getElementById('newCompanyForm').style.display = 'block';
            step1NextBtn.disabled = false;
            isNewCompany = true;
            selectedCompany = null;

            // Make new company fields required
            setNewCompanyFieldsRequired(true);
        } else {
            // Show existing company details
            const company = companiesCache.find(c => c.id == companyId);
            if (company) {
                displayCompanyDetails(company);
                document.getElementById('companyDetailsDisplay').style.display = 'block';
                document.getElementById('newCompanyForm').style.display = 'none';
                step1NextBtn.disabled = false;
                selectedCompany = company;
                isNewCompany = false;

                // Remove required from new company fields
                setNewCompanyFieldsRequired(false);
            }
        }
    }

    /**
     * Display company details
     */
    function displayCompanyDetails(company) {
        document.getElementById('displayCompanyName').textContent = company.name;
        document.getElementById('displayCompanyDetails').textContent = company.address || company.companyDetails || 'N/A';
        document.getElementById('displayWebsite').textContent = company.website || company.address || 'N/A';
        document.getElementById('displayTechnology').textContent = company.technologies || company.technology || 'N/A';
        document.getElementById('displayInternshipNote').textContent = company.numEmployees || company.paidInternshipNotAllowed || 'N/A';
    }

    /**
     * Set required attribute for new company fields
     */
    function setNewCompanyFieldsRequired(required) {
        const fields = [
            'newCompanyName'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                if (required) {
                    field.setAttribute('required', 'required');
                } else {
                    field.removeAttribute('required');
                }
            }
        });
    }

    /**
     * Navigate to next step
     */
    function nextStep() {
        if (!validateCurrentStep()) {
            return;
        }

        // Save current step data
        saveStepData(currentStep);

        // Move to next step
        currentStep++;
        if (currentStep > 3) currentStep = 3;

        // If moving to step 3, populate review
        if (currentStep === 3) {
            populateReview();
        }

        updateStepDisplay();
    }

    /**
     * Navigate to previous step
     */
    function prevStep() {
        currentStep--;
        if (currentStep < 1) currentStep = 1;
        updateStepDisplay();
    }

    /**
     * Update step display
     */
    function updateStepDisplay() {
        // Update progress indicators
        document.querySelectorAll('.progress-steps .step').forEach((step, index) => {
            if (index + 1 < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Update form steps
        document.querySelectorAll('.form-step').forEach((step, index) => {
            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Validate current step
     */
    function validateCurrentStep() {
        if (currentStep === 1) {
            const companySelect = document.getElementById('companySelect');
            if (!companySelect.value) {
                portalUtils.showNotification('Please select a company', 'warning');
                return false;
            }

            if (isNewCompany) {
                // Validate new company fields
                const requiredFields = [
                    { id: 'newCompanyName', label: 'Company Name' }
                ];

                for (const field of requiredFields) {
                    const value = document.getElementById(field.id).value.trim();
                    if (!value) {
                        portalUtils.showNotification(`Please enter ${field.label}`, 'warning');
                        return false;
                    }
                }

            }

            return true;
        }

        if (currentStep === 2) {
            // Validate NOC details
            if (derivedStudentId === null) {
                portalUtils.showNotification(
                    'Cannot proceed: unable to extract Student ID from your college email.',
                    'error'
                );
                return false;
            }

            const semester = document.getElementById('semester').value;
            const mobile = document.getElementById('mobileNumber').value.trim();
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            if (!semester) {
                portalUtils.showNotification('Please select semester', 'warning');
                return false;
            }

            if (!mobile) {
                portalUtils.showNotification('Please enter mobile number', 'warning');
                return false;
            }

            if (!startDate || !endDate) {
                portalUtils.showNotification('Please select internship dates', 'warning');
                return false;
            }

            if (new Date(endDate) <= new Date(startDate)) {
                portalUtils.showNotification('End date must be after start date', 'warning');
                return false;
            }

            return true;
        }

        return true;
    }

    /**
     * Validate dates
     */
    function validateDates() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (startDate && endDate) {
            if (new Date(endDate) <= new Date(startDate)) {
                document.getElementById('endDate').setCustomValidity('End date must be after start date');
            } else {
                document.getElementById('endDate').setCustomValidity('');
            }
        }
    }

    /**
     * Save step data
     */
    function saveStepData(step) {
        if (step === 1) {
            if (isNewCompany) {
                formData.newCompany = {
                    name: document.getElementById('newCompanyName').value.trim(),
                    companyDetails: '',
                    technology: '',
                    paidInternshipNotAllowed: ''
                };
            } else {
                formData.companyId = selectedCompany.id;
            }
        }

        if (step === 2) {
            formData.semester = parseInt(document.getElementById('semester').value);
            formData.mobile = document.getElementById('mobileNumber').value.trim();
            formData.startDate = document.getElementById('startDate').value;
            formData.endDate = document.getElementById('endDate').value;
        }
    }

    /**
     * Populate review section
     */
    function populateReview() {
        // Student info
        document.getElementById('reviewStudentName').textContent = currentUser.name;
        document.getElementById('reviewStudentId').textContent = derivedStudentId !== null ? derivedStudentId : 'N/A';
        document.getElementById('reviewSemester').textContent = formData.semester + 'th Semester';
        document.getElementById('reviewEmail').textContent = currentUser.email;
        document.getElementById('reviewMobile').textContent = formData.mobile;

        // Company info
        if (isNewCompany) {
            document.getElementById('reviewCompany').textContent = formData.newCompany.name + ' (Pending Approval)';
            document.getElementById('reviewLocation').textContent = 'N/A';
            document.getElementById('pendingCompanyNotice').style.display = 'block';
        } else {
            document.getElementById('reviewCompany').textContent = selectedCompany.name;
            document.getElementById('reviewLocation').textContent = selectedCompany.address || selectedCompany.website || selectedCompany.location || 'N/A';
            document.getElementById('pendingCompanyNotice').style.display = 'none';
        }

        document.getElementById('reviewStartDate').textContent = formatDate(formData.startDate);
        document.getElementById('reviewEndDate').textContent = formatDate(formData.endDate);
    }

    /**
     * Format date for display
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    /**
     * Handle form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        // Check declaration
        if (!document.getElementById('declaration').checked) {
            portalUtils.showNotification('Please accept the declaration', 'warning');
            return;
        }

        // Disable submit button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        // Process submission
        processNOCRequest();
    }

    /**
     * Process NOC request
     */
    async function processNOCRequest() {
        try {
            console.log('📝 Starting NOC Request Submission Process');

            // Check authentication
            const token = localStorage.getItem('jwt_token');
            console.log('🔑 Auth Token:', token ? 'Present ✅' : 'Missing ❌');

            if (!token) {
                throw new Error('Not authenticated. Please login again.');
            }

            // Check current user
            console.log('👤 Current User:', currentUser);

            if (!currentUser || !currentUser.email) {
                throw new Error('User information not found. Please login again.');
            }

            if (derivedStudentId === null) {
                throw new Error('Invalid student email format. Expected YYBRANCH###@charusat.edu.in');
            }

            let companyId;

            // Handle new company submission
            if (isNewCompany) {
                const newCompanyData = formData.newCompany;

                console.log('🏢 Submitting new company:', newCompanyData);
                portalUtils.showNotification('Submitting new company for approval...', 'info');

                const companyResponse = await apiService.addCompany(newCompanyData);

                if (companyResponse.success) {
                    companyId = companyResponse.company.id;
                    console.log('✅ New company created with ID:', companyId);
                    portalUtils.showNotification('New company submitted for approval', 'success');
                } else {
                    console.error('❌ Failed to add company:', companyResponse.message);
                    throw new Error(companyResponse.message || 'Failed to add company');
                }
            } else {
                companyId = formData.companyId;
                console.log('🏢 Using existing company ID:', companyId);
            }

            // Validate all required fields
            console.log('🔍 Validating NOC request data...');

            if (!formData.semester) {
                throw new Error('Semester is required');
            }
            if (!formData.mobile) {
                throw new Error('Mobile number is required');
            }
            if (!companyId) {
                throw new Error('Company selection is required');
            }
            if (!formData.startDate) {
                throw new Error('Internship start date is required');
            }
            if (!formData.endDate) {
                throw new Error('Internship end date is required');
            }

            // Submit NOC request
            const nocData = {
                semester: parseInt(formData.semester),
                mobile: formData.mobile,
                companyId: parseInt(companyId),
                startDate: formData.startDate,
                endDate: formData.endDate
            };

            console.log('📤 Submitting NOC Request:', nocData);
            portalUtils.showNotification('Submitting NOC request...', 'info');

            const nocResponse = await apiService.submitNOC(nocData);

            console.log('📥 NOC Response:', nocResponse);

            if (nocResponse.success) {
                const nocRequest = nocResponse.nocRequest;
                console.log('✅ NOC Request Submitted Successfully:', nocRequest);
                showSuccessMessage(nocRequest.nocId, false);

            } else if (nocResponse.code === 'DUPLICATE_NOC' && nocResponse.existingNOC) {
                // Student already has a NOC for this company — show them their existing one
                const ex = nocResponse.existingNOC;
                const statusLabels = {
                    submitted: '⏳ Pending faculty review',
                    under_review: '🔎 Under review',
                    approved: '✅ Approved',
                    signed: '📝 Signed'
                };
                const statusText = statusLabels[ex.status] || ex.status;
                console.warn('⚠️ Duplicate NOC detected:', ex);

                portalUtils.showNotification(
                    `You already have a NOC for ${ex.companyName} (${ex.nocId}). Status: ${statusText}`,
                    'warning'
                );

                // Show a helpful message block
                const successContainer = document.getElementById('successContainer') ||
                                         document.getElementById('formContainer');
                if (successContainer) {
                    successContainer.innerHTML = `
                        <div style="background:#fef9c3;border:1.5px solid #f59e0b;border-radius:12px;padding:2rem;text-align:center;max-width:600px;margin:2rem auto;">
                            <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
                            <h3 style="color:#92400e;margin-bottom:0.5rem;">NOC Already Submitted</h3>
                            <p style="color:#78350f;margin-bottom:1rem;">
                                You already have a NOC request for <strong>${ex.companyName}</strong>
                                (ID: <strong>${ex.nocId}</strong>).<br>
                                Current status: <strong>${statusText}</strong>
                            </p>
                            <p style="color:#78350f;font-size:0.875rem;">
                                ${ex.status === 'submitted' ? 'Your request is awaiting faculty review. You will be notified once it is approved.' :
                                  ex.status === 'approved' ? 'Your NOC is approved! Go to your dashboard to download the PDF.' : ''}
                            </p>
                            <a href="student-dashboard.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block;">
                                📊 Go to Dashboard
                            </a>
                        </div>`;
                }

                document.getElementById('submitBtn').disabled = false;
                document.getElementById('submitBtn').textContent = 'Submit NOC Request';

            } else {
                console.error('❌ NOC Submission Failed:', nocResponse.message);
                throw new Error(nocResponse.message || 'Failed to submit NOC request');
            }

        } catch (error) {
            console.error('💥 Error processing NOC request:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });

            portalUtils.showNotification(error.message || 'Error submitting request. Please try again.', 'error');
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('submitBtn').textContent = 'Submit NOC Request';
        }
    }

    /**
     * Generate and download PDF
     */
    function generateAndDownloadPDF(nocRequest, company) {
        const studentData = {
            name: currentUser.name,
            id: derivedStudentId,
            department: currentUser.department || 'Computer Science'
        };

        const pdf = pdfGenerator.generateNOCPDF(nocRequest, company, studentData);
        if (pdf) {
            const filename = `NOC_${nocRequest.nocId}_${currentUser.name.replace(/\s+/g, '_')}.pdf`;
            pdfGenerator.downloadPDF(pdf, filename);
        }
    }

    /**
     * Show success message
     */
    function showSuccessMessage(nocId, pdfGenerated) {
        document.getElementById('generatedNOCId').textContent = nocId;

        // Updated message - PDF only available after faculty approval
        document.getElementById('pdfDownloadMessage').textContent = 'Your NOC request has been submitted for faculty review. You will be able to download the PDF certificate once it is approved.';

        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('submitBtn').style.display = 'none';
        document.querySelector('.btn-prev').style.display = 'none';
        document.querySelector('.checkbox-group').style.display = 'none';

        portalUtils.showNotification('NOC request submitted successfully! Awaiting faculty approval.', 'success');
    }
});
