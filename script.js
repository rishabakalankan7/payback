document.addEventListener('DOMContentLoaded', () => {
    const friendsInput = document.getElementById('friends');
    const updateFriendsBtn = document.getElementById('updateFriends');
    const expensesContainer = document.getElementById('expenses-container');
    const addExpenseBtn = document.getElementById('add-expense');
    const generateJsonBtn = document.getElementById('generate-json');
    const calculateSettlementsBtn = document.getElementById('calculate-settlements');
    const jsonOutputContainer = document.getElementById('json-output-container');
    const jsonOutput = document.getElementById('json-output');
    const downloadJsonBtn = document.getElementById('download-json');
    const resultsContainer = document.getElementById('results-container');
    const resultsList = document.getElementById('results-list');
    const importJsonArea = document.getElementById('json-import-area');
    const importJsonBtn = document.getElementById('import-json-btn');
    const shareTripBtn = document.getElementById('share-trip');
    const shareContainer = document.getElementById('share-container');
    const shareLinkInput = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const readOnlyView = document.getElementById('read-only-view');
    const editView = document.getElementById('edit-view');
    const editModeBtn = document.getElementById('edit-mode-btn');
    const readOnlyFriendsList = document.getElementById('read-only-friends-list');
    const readOnlyExpensesContainer = document.getElementById('read-only-expenses-container');
    const readOnlyResultsList = document.getElementById('read-only-results-list');
    const importSection = document.getElementById('import-section');

    let friends = [];
    let expenseCount = 0;
    let currentTripData = null;

    // Check if admin mode is enabled
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('mode') === 'admin';
    
    // Show/hide admin-only sections
    if (isAdminMode) {
        importSection.style.display = 'block';
        generateJsonBtn.style.display = 'block';
    }

    updateFriendsBtn.addEventListener('click', () => {
        const friendNames = friendsInput.value.split(',').map(name => name.trim()).filter(name => name);
        if (friendNames.length > 0) {
            friends = friendNames;
            alert('Friends list updated!');
            updateAllExpenseForms();
        } else {
            alert('Please enter at least one friend.');
        }
    });

    addExpenseBtn.addEventListener('click', () => {
        addExpenseForm();
    });

    importJsonBtn.addEventListener('click', () => {
        const jsonString = importJsonArea.value;
        if (!jsonString) {
            alert('Please paste JSON data into the text area first.');
            return;
        }
        try {
            const tripData = JSON.parse(jsonString);
            populateUiWithData(tripData);
        } catch (error) {
            alert('Invalid JSON format. Please check the pasted content.\n' + error);
        }
    });

    shareTripBtn.addEventListener('click', () => {
        const tripDetails = getTripDetailsFromUI();
        if (tripDetails) {
            const jsonString = JSON.stringify(tripDetails);
            const encodedData = btoa(jsonString);
            const shareableLink = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
            
            shareLinkInput.value = shareableLink;
            shareContainer.style.display = 'block';
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    });

    editModeBtn.addEventListener('click', () => {
        switchToEditMode();
    });

    window.addEventListener('load', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');

        if (sharedData) {
            try {
                const decodedJson = atob(sharedData);
                const tripData = JSON.parse(decodedJson);
                currentTripData = tripData;
                const settlements = calculateSettlements(tripData);
                displayReadOnlyView(tripData, settlements);
            } catch (error) {
                alert('Could not load shared trip data. The link may be corrupted.\n' + error);
            }
        }
    });

    function populateUiWithData(data) {
        // 1. Reset current state
        expensesContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
        jsonOutputContainer.style.display = 'none';
        expenseCount = 0;

        // 2. Populate friends
        if (data.friends && Array.isArray(data.friends)) {
            friends = data.friends;
            friendsInput.value = friends.join(', ');
        } else {
            friends = [];
            friendsInput.value = '';
        }

        // 3. Populate expenses
        if (data.expenses && Array.isArray(data.expenses)) {
            data.expenses.forEach(expense => {
                addExpenseForm(expense);
            });
        }
    }

    function addExpenseForm(expenseData = null) {
        expenseCount++;
        const expenseId = `expense-${expenseCount}`;
        const expenseForm = document.createElement('div');
        expenseForm.classList.add('expense-item');
        expenseForm.id = expenseId;
        expenseForm.innerHTML = `
            <h6>Expense ${expenseCount}</h6>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="${expenseId}-description" class="form-label">Description</label>
                    <input type="text" class="form-control" id="${expenseId}-description" placeholder="e.g., Petrol Pump">
                </div>
                <div class="col-md-6 mb-3">
                    <label for="${expenseId}-amount" class="form-label">Amount</label>
                    <input type="number" class="form-control" id="${expenseId}-amount" placeholder="e.g., 1800">
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="${expenseId}-paidBy" class="form-label">Paid By</label>
                    <select class="form-select" id="${expenseId}-paidBy">
                        ${getFriendOptions()}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Split Between</label>
                    <div id="${expenseId}-splitBetween">
                        ${getFriendCheckboxes(expenseId)}
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="${expenseId}-time" class="form-label">Time</label>
                    <input type="datetime-local" class="form-control" id="${expenseId}-time">
                </div>
                <div class="col-md-6 mb-3">
                    <label for="${expenseId}-location" class="form-label">Location</label>
                    <input type="text" class="form-control" id="${expenseId}-location" placeholder="e.g., Gingee">
                </div>
            </div>
             <button class="btn btn-danger btn-sm" onclick="removeExpense('${expenseId}')"><i class="fas fa-trash-alt"></i> Remove</button>
        `;
        expensesContainer.appendChild(expenseForm);

        if (expenseData) {
            document.getElementById(`${expenseId}-description`).value = expenseData.description || '';
            document.getElementById(`${expenseId}-amount`).value = expenseData.amount || '';
            document.getElementById(`${expenseId}-paidBy`).value = expenseData.paidBy || '';
            
            const time = expenseData.otherDetails?.time;
            if (time) {
                const d = new Date(time);
                if (!isNaN(d)) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    document.getElementById(`${expenseId}-time`).value = `${year}-${month}-${day}T${hours}:${minutes}`;
                }
            }

            document.getElementById(`${expenseId}-location`).value = expenseData.otherDetails?.location || '';

            const splitCheckboxes = document.querySelectorAll(`#${expenseId}-splitBetween .form-check-input`);
            splitCheckboxes.forEach(checkbox => {
                checkbox.checked = expenseData.splitBetween?.includes(checkbox.value) || false;
            });
        }
    }

    window.removeExpense = function(expenseId) {
        const expenseElement = document.getElementById(expenseId);
        if (expenseElement) {
            expenseElement.remove();
        }
    }

    function getFriendOptions() {
        if (friends.length === 0) return '<option>Update friends list first</option>';
        return friends.map(friend => `<option value="${friend}">${friend}</option>`).join('');
    }

    function getFriendCheckboxes(expenseId) {
        if (friends.length === 0) return '<p>Update friends list first</p>';
        return friends.map((friend, index) => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${friend}" id="${expenseId}-split-${index}" checked>
                <label class="form-check-label" for="${expenseId}-split-${index}">
                    ${friend}
                </label>
            </div>
        `).join('');
    }

    function updateAllExpenseForms() {
        const expenseElements = document.querySelectorAll('.expense-item');
        expenseElements.forEach(expenseElement => {
            const expenseId = expenseElement.id;
            const paidBySelect = document.getElementById(`${expenseId}-paidBy`);
            const splitBetweenDiv = document.getElementById(`${expenseId}-splitBetween`);

            if (paidBySelect) {
                const currentPaidBy = paidBySelect.value;
                paidBySelect.innerHTML = getFriendOptions();
                if (friends.includes(currentPaidBy)) {
                    paidBySelect.value = currentPaidBy;
                }
            }

            if (splitBetweenDiv) {
                const currentlyChecked = [];
                const currentCheckboxes = splitBetweenDiv.querySelectorAll('.form-check-input:checked');
                currentCheckboxes.forEach(checkbox => {
                    currentlyChecked.push(checkbox.value);
                });

                splitBetweenDiv.innerHTML = getFriendCheckboxes(expenseId);
                const newCheckboxes = splitBetweenDiv.querySelectorAll('.form-check-input');
                
                newCheckboxes.forEach(checkbox => {
                    checkbox.checked = currentlyChecked.includes(checkbox.value);
                });
            }
        });
    }

    calculateSettlementsBtn.addEventListener('click', () => {
        const tripDetails = getTripDetailsFromUI();
        if (tripDetails) {
            const settlements = calculateSettlements(tripDetails);
            displaySettlements(settlements);
            shareTripBtn.disabled = false;
        }
    });

    function getTripDetailsFromUI() {
        if (friends.length === 0) {
            alert('Please add friends first.');
            return null;
        }

        const tripDetails = {
            friends: friends,
            expenses: []
        };

        const expenseElements = document.querySelectorAll('.expense-item');
        expenseElements.forEach(expenseElement => {
            const expenseId = expenseElement.id;
            if (!expenseId) return;

            const description = document.getElementById(`${expenseId}-description`).value;
            const amount = parseFloat(document.getElementById(`${expenseId}-amount`).value);
            const paidBy = document.getElementById(`${expenseId}-paidBy`).value;
            const time = document.getElementById(`${expenseId}-time`).value;
            const location = document.getElementById(`${expenseId}-location`).value;
            
            const splitBetween = [];
            const checkboxes = document.querySelectorAll(`#${expenseId}-splitBetween .form-check-input:checked`);
            checkboxes.forEach(checkbox => {
                splitBetween.push(checkbox.value);
            });

            if (description && !isNaN(amount) && paidBy && splitBetween.length > 0) {
                tripDetails.expenses.push({
                    description,
                    amount,
                    paidBy,
                    splitBetween,
                    otherDetails: {
                        time: time || new Date().toLocaleString(),
                        location: location || "Unknown"
                    }
                });
            }
        });
        return tripDetails;
    }

    generateJsonBtn.addEventListener('click', () => {
        const tripDetails = getTripDetailsFromUI();
        if (tripDetails) {
            const jsonString = JSON.stringify(tripDetails, null, 4);
            jsonOutput.textContent = jsonString;
            jsonOutputContainer.style.display = 'block';
        }
    });

    function calculateSettlements(tripDetails) {
        const clubbedTransactions = {};

        tripDetails.expenses.forEach(expense => {
            const splitAmount = expense.amount / expense.splitBetween.length;
            const payer = expense.paidBy;

            expense.splitBetween.forEach(participant => {
                if (participant === payer) {
                    return; // Skip if participant is the payer
                }

                // Create a sorted key to group transactions between two people
                const clubKey = [participant, payer].sort().join('::');

                if (!clubbedTransactions[clubKey]) {
                    clubbedTransactions[clubKey] = [];
                }

                clubbedTransactions[clubKey].push({
                    from: participant,
                    to: payer,
                    amount: splitAmount,
                    description: expense.description
                });
            });
        });

        const finalSettlements = [];
        for (const key in clubbedTransactions) {
            const transactions = clubbedTransactions[key];
            let netAmount = 0;
            let personA = transactions[0].from;
            let personB = transactions[0].to;

            transactions.forEach(tx => {
                if (tx.from === personA) {
                    netAmount += tx.amount; // Person A owes Person B
                } else {
                    netAmount -= tx.amount; // Person B owes Person A
                }
            });

            let from, to;
            if (netAmount > 0) {
                from = personA;
                to = personB;
            } else {
                from = personB;
                to = personA;
                netAmount = -netAmount;
            }

            if (netAmount > 0.01) { // Avoid floating point inaccuracies for zero balances
                finalSettlements.push({
                    from: from,
                    to: to,
                    amount: Math.round(netAmount * 100) / 100
                });
            }
        }
        return finalSettlements;
    }

    function displaySettlements(settlements) {
        resultsList.innerHTML = ''; // Clear previous results

        if (settlements.length === 0) {
            resultsList.innerHTML = '<div class="settlements-empty"><i class="fas fa-check-circle"></i> All dues are settled!</div>';
        } else {
            settlements.forEach((res, index) => {
                const li = document.createElement('div');
                li.className = `settlement-card ${index % 2 === 0 ? '' : 'alternate'}`;
                li.innerHTML = `
                    <div class="settlement-from">
                        <i class="fas fa-user-circle settlement-icon"></i>
                        <span class="settlement-from-name">${res.from}</span>
                    </div>
                    <div class="settlement-arrow-section">
                        <span class="settlement-arrow">→</span>
                    </div>
                    <div class="settlement-from">
                        <span class="settlement-from-name">${res.to}</span>
                        <i class="fas fa-user-circle settlement-icon"></i>
                    </div>
                    <div class="settlement-amount">
                        <span style="font-weight: bold; font-size: 1.2rem;">₹</span>
                        <span>${res.amount.toFixed(2)}</span>
                    </div>
                `;
                resultsList.appendChild(li);
            });
        }
        resultsContainer.style.display = 'block';
    }

    function displayReadOnlyView(tripData, settlements) {
        // Display friends
        readOnlyFriendsList.innerHTML = '';
        if (tripData.friends && Array.isArray(tripData.friends)) {
            tripData.friends.forEach(friend => {
                const chip = document.createElement('span');
                chip.className = 'friend-chip';
                chip.textContent = friend;
                readOnlyFriendsList.appendChild(chip);
            });
        }

        // Display expenses
        readOnlyExpensesContainer.innerHTML = '';
        if (tripData.expenses && Array.isArray(tripData.expenses)) {
            tripData.expenses.forEach((expense, index) => {
                const expenseDiv = document.createElement('div');
                expenseDiv.className = 'read-only-expense-item';
                
                const splitBetweenText = expense.splitBetween.join(', ');
                const timeDisplay = expense.otherDetails?.time ? new Date(expense.otherDetails.time).toLocaleString() : 'N/A';
                const locationDisplay = expense.otherDetails?.location || 'Unknown';
                
                expenseDiv.innerHTML = `
                    <h6>${expense.description}</h6>
                    <div class="read-only-expense-detail">
                        <span class="read-only-expense-label">Amount:</span>
                        <span>₹${expense.amount.toFixed(2)}</span>
                    </div>
                    <div class="read-only-expense-detail">
                        <span class="read-only-expense-label">Paid By:</span>
                        <span><strong>${expense.paidBy}</strong></span>
                    </div>
                    <div class="read-only-expense-detail">
                        <span class="read-only-expense-label">Split Between:</span>
                        <span>${splitBetweenText}</span>
                    </div>
                    <div class="read-only-expense-detail">
                        <span class="read-only-expense-label">Location:</span>
                        <span>${locationDisplay}</span>
                    </div>
                    <div class="read-only-expense-detail">
                        <span class="read-only-expense-label">Time:</span>
                        <span>${timeDisplay}</span>
                    </div>
                `;
                readOnlyExpensesContainer.appendChild(expenseDiv);
            });
        }

        // Display settlements
        readOnlyResultsList.innerHTML = '';
        if (settlements.length === 0) {
            readOnlyResultsList.innerHTML = '<div class="settlements-empty"><i class="fas fa-check-circle"></i> All dues are settled!</div>';
        } else {
            settlements.forEach((res, index) => {
                const li = document.createElement('div');
                li.className = `settlement-card ${index % 2 === 0 ? '' : 'alternate'}`;
                li.innerHTML = `
                    <div class="settlement-from">
                        <i class="fas fa-user-circle settlement-icon"></i>
                        <span class="settlement-from-name">${res.from}</span>
                    </div>
                    <div class="settlement-arrow-section">
                        <span class="settlement-arrow">→</span>
                    </div>
                    <div class="settlement-from">
                        <span class="settlement-from-name">${res.to}</span>
                        <i class="fas fa-user-circle settlement-icon"></i>
                    </div>
                    <div class="settlement-amount">
                        <span style="font-weight: bold; font-size: 1.2rem;">₹</span>
                        <span>${res.amount.toFixed(2)}</span>
                    </div>
                `;
                readOnlyResultsList.appendChild(li);
            });
        }

        // Show read-only view, hide edit view
        editView.style.display = 'none';
        readOnlyView.style.display = 'block';
    }

    function switchToEditMode() {
        // Show edit view, hide read-only view
        readOnlyView.style.display = 'none';
        editView.style.display = 'block';
        
        // Populate edit form with current trip data if available
        if (currentTripData) {
            populateUiWithData(currentTripData);
        }
    }

    downloadJsonBtn.addEventListener('click', () => {
        const jsonString = jsonOutput.textContent;
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trip_details.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
