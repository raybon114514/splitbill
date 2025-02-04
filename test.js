let expenses = []; // 購物記錄
let users = ["用戶1", "用戶2", "用戶3"]; // 預設用戶列表

// 更新使用者下拉選單
function updateUserDropdown() {
    const userDropdown = document.getElementById("current-user");
    userDropdown.innerHTML = "";
    users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        userDropdown.appendChild(option);
    });
}

// 更新購買者下拉選單
function updateBuyerDropdown() {
    const buyerDropdown = document.getElementById("buyer");
    buyerDropdown.innerHTML = "";
    users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        buyerDropdown.appendChild(option);
    });
}

// 更新參與者核取方塊
function updateUserCheckboxes() {
    const membersDiv = document.getElementById("members");
    membersDiv.innerHTML = "";
    users.forEach((user) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = user;
        checkbox.id = `member-${user}`;

        const label = document.createElement("label");
        label.htmlFor = `member-${user}`;
        label.textContent = user;

        const wrapper = document.createElement("div");
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        membersDiv.appendChild(wrapper);
    });
}

// 新增購物記錄
function addExpense(event) {
    event.preventDefault();

    const item = document.getElementById("item").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const buyer = document.getElementById("buyer").value;
    const selectedMembers = Array.from(
        document.querySelectorAll("#members input[type='checkbox']:checked")
    ).map((checkbox) => checkbox.value);

    if (!item || isNaN(amount) || !buyer || selectedMembers.length === 0) {
        alert("請填寫完整的購物內容並選擇參與者！");
        return;
    }

    const expense = { item, amount, buyer, members: selectedMembers };
    expenses.push(expense);

    // 註解掉的後端保存功能
    // saveExpenseToDatabase(expense);
    updateExpenseList();
    updateSettlement();
}

function updateExpenseList() {
    const expenseList = document.getElementById("expense-list");
    expenseList.innerHTML = "";

    expenses.forEach((expense, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = `${expense.item} - ${expense.amount} 元 (購買者: ${expense.buyer}, 參與者: ${expense.members.join(", ")})`;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "刪除";
        deleteButton.addEventListener("click", () => deleteExpense(index));

        listItem.appendChild(deleteButton);
        expenseList.appendChild(listItem);
    });
}

// 刪除購物記錄
function deleteExpense(index) {
    expenses.splice(index, 1);
    updateExpenseList();
    updateSettlement();
}

// 結算邏輯（保持不變）
function updateSettlement() {
  const transactions = {};  // 追蹤買家與其他參與者的交易
  const userPayments = {};  // 追蹤每個用戶的實際支付金額

  // 計算每個用戶的應付款（負值）和應收款（正值）
  expenses.forEach((expense) => {
    const { buyer, amount, members } = expense;
    const share = amount / members.length;  // 每個參與者分攤的金額

    // 記錄每一對用戶之間的欠款關係
    members.forEach((member) => {
      if (member !== buyer) {
        const key = [buyer, member].join(" -> ");  // 這樣設置是為了確保交易方向明確

        // 如果這對用戶已經有記錄，則累加金額，否則初始化
        if (transactions[key]) {
          transactions[key] += share;
        } else {
          transactions[key] = share;
        }
      }
    });

    // 累加買家支付的金額
    if (userPayments[buyer]) {
      userPayments[buyer] += amount;  // 累加買家的支付金額
    } else {
      userPayments[buyer] = amount;
    }
  });

  const mergedTransactions = {};  // 儲存合併後的交易

  // 對現有交易進行反向抵銷
  for (const [key, amount] of Object.entries(transactions)) {
    const [from, to] = key.split(" -> ");
    const reverseKey = [to, from].join(" -> ");  // 查找反向交易


    // 如果存在反向交易，則進行對沖
    if (transactions[reverseKey]) {
      const reverseAmount = transactions[reverseKey];

      if (amount > reverseAmount) {
        // 如果金額 A -> B 比 B -> A 大，則將差額保留
        mergedTransactions[key] = amount - reverseAmount;
      } else if (amount < reverseAmount) {
        // 如果金額 B -> A 比 A -> B 大，則將差額保留
        mergedTransactions[reverseKey] = reverseAmount - amount;
      } else {
        // 如果兩者金額相等，則完全抵銷
        delete mergedTransactions[key];
        delete mergedTransactions[reverseKey];
      }
    }
	else{
		mergedTransactions[key] = amount;
	}
		
  }

  // 刪除已經處理過的交易紀錄
  for (const key of Object.keys(transactions)) {
    if (mergedTransactions[key] === undefined) {
      delete transactions[key];
    }
  }

  // 更新結算區域顯示
  const settleSummary = document.getElementById("settle-summary");
  settleSummary.innerHTML = "";  // 清空現有顯示

  // 顯示「支付情況」標題
  const paymentTitle = document.createElement("h2");
  paymentTitle.textContent = "支付情況：";
  settleSummary.appendChild(paymentTitle);

  // 顯示每個用戶實際支付的金額
  Object.entries(userPayments).forEach(([user, totalPaid]) => {
    const paymentElement = document.createElement("p");
    paymentElement.textContent = `${user} 實際支付了 ${totalPaid.toFixed(2)} 元`;
    settleSummary.appendChild(paymentElement);
  });

  // 顯示「交易明細」標題
  const transactionTitle = document.createElement("h2");
  transactionTitle.textContent = "交易明細：";
  settleSummary.appendChild(transactionTitle);

  // 顯示每個合併後的交易
  Object.entries(mergedTransactions).forEach(([key, amount]) => {
    const [from, to] = key.split(" -> ");
    const transactionElement = document.createElement("p");
    transactionElement.textContent = `${to} 應支付 ${amount.toFixed(2)} 元給 ${from}`;  // 顯示 "參與者應付給購買者"
    settleSummary.appendChild(transactionElement);
  });
}

// 新增用戶
function addUser(event) {
    event.preventDefault();

    const newUser = document.getElementById("new-user").value.trim();
    if (!newUser || users.includes(newUser)) {
        alert("用戶名稱無效或已存在！");
        return;
    }

    users.push(newUser);
    updateUserCheckboxes();
    updateUserList();
    updateUserDropdown();
    updateSettlement();
    updateBuyerDropdown();
    document.getElementById("new-user").value = "";
}

// 更改用戶名字
function renameUser(event) {
    event.preventDefault();
  
    const currentUser = document.getElementById("current-user").value;
    const newUserName = document.getElementById("new-user-name").value.trim();
  
    if (!currentUser || newUserName === "") {
        alert("請選擇用戶並輸入新名字！");
        return;
    }
  
    if (users.includes(newUserName)) {
        alert("新名字已存在，請選擇其他名字！");
        return;
    }
  
    const userIndex = users.indexOf(currentUser);
    if (userIndex !== -1) {
        users[userIndex] = newUserName;
        updateUserCheckboxes();
        updateUserList();
        updateUserDropdown();
        updateSettlement();
        updateBuyerDropdown();
    }
  
    document.getElementById("rename-user-form").reset();
    alert(`用戶名稱已更改為 ${newUserName}!`);
}

// 更新用戶列表
function updateUserList() {
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";
    users.forEach((user) => {
        const listItem = document.createElement("li");
        listItem.textContent = user;
        userList.appendChild(listItem);
    });
}

// 初始化頁面
function init() {
    updateBuyerDropdown();
    updateUserCheckboxes();
    updateUserList();
    updateExpenseList();
    document.getElementById("expense-form").addEventListener("submit", addExpense);
    document.getElementById("user-form").addEventListener("submit", addUser);
}

// 動畫效果相關程式碼（保持不變）
const moneyContainer = document.querySelector('.money-container');
const moneySymbols = ['💰', '💵', '💸', '$', '€', '¥'];

function createMoney() {
    const money = document.createElement('div');
    money.classList.add('money');
    money.textContent = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
    money.style.left = Math.random() * 100 + 'vw';
    money.style.animationDuration = Math.random() * 3 + 3 + 's';
    money.style.fontSize = Math.random() * 20 + 20 + 'px';
    moneyContainer.appendChild(money);

    setTimeout(() => {
        money.remove();
    }, 5000);
}

setInterval(createMoney, 300);

// 頁面導航功能（保持不變）
function navigateToSection(event) {
    event.preventDefault();
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    const targetId = event.target.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', navigateToSection);
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById('home').style.display = 'block';
    init();
    initRenameUser();
});

function initRenameUser() {
    updateUserDropdown();
    document.getElementById("rename-user-form").addEventListener("submit", renameUser);
}

/* 註解掉的後端相關功能
function saveExpenseToDatabase(expense) {
    // 原後端保存功能已註解
    // fetch('add_expense.php', {...});
}
*/