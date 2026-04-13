const form = document.getElementById('user-form');
const userList = document.getElementById('user-list');
const userTableList = document.getElementById('user-table');
const submitStaus = document.getElementById('submit-status');
const dataStatus = document.getElementById('data-status');
const search = document.getElementById('search');
const reloadButton = document.getElementById('reload-button');
//編集するモーダル関連要素
const openEditModalButton = document.getElementById('open-edit-modal-button');
const editModal = document.getElementById('edit-modal');
const closeEditModalButton = document.getElementById('close-modal');

//ユーザー情報を取得する機能
async function loadUsers() {
    //指定したinputID要素の値取得を確認する
    console.log(search.value);
    const query = search.value.trim();
    const url = query? `/api/users?q=${encodeURIComponent(query)}`:'/api/users';

    dataStatus.textContent = '読み込み中...';

    try {
        const response = await fetch(url);
        const users = await response.json();

        userList.innerHTML= '';

        if (!Array.isArray(users) || users.length === 0) {
            dataStatus.textContent = 'ユーザーが見つかりません。';
            return;
        }

        dataStatus.textContent = `${users.length}件取得しました。`;
        // TODO. 編集ができるようにテーブル表示方法を改善してみよう
        // ① テンプレート関数化:1レコードをどう描画するか担当する
        function createUserRow(user) {
            const tr = document.createElement('tr');
            tr.dataset.id = `${user.id}`;

            const tdName = document.createElement('td');
            tdName.textContent = `${user.name}`;

            const tdEmail = document.createElement('td');
            tdEmail.textContent = `${user.email}`;

            const tdAction = document.createElement('td');
            const editCheckRadio = document.createElement('input');
            editCheckRadio.type = 'radio';
            // radioはnameでグループ化されて初めて機能する
            editCheckRadio.name = 'user-select';
            editCheckRadio.value = user.id;
            
            editCheckRadio.addEventListener('click', () => {
                console.log('編集対象ユーザーID:', user.id);
                console.log('ユーザーIDが入っているか値確認:', editCheckRadio.value);
            });
            tdAction.appendChild(editCheckRadio);
            //親要素である<tr>に、作成した子要素<td>を追加する
            tr.append(tdName,tdEmail,tdAction);

            return tr;
        }
        // ② パフォーマンス改善:DOM反映を一括で行う役割を担当する
        function renderUserTable(users, userTableList) {
            const fragment = document.createDocumentFragment();

            for (const user of users) {
                const row = createUserRow(user);
                fragment.appendChild(row);
            }
            userTableList.innerHTML= '';//初期化
            userTableList.appendChild(fragment);
        }
        // DOM反映を一括で行うメソッドを呼び出し
        renderUserTable(users, userTableList);
    } catch (error) {
        dataStatus.textContent = `取得失敗：${error.message}`;
    }
}

//ユーザーを登録する機能
form.addEventListener('submit', async event => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
        name: formData.get('name'),
        email: formData.get('email')
    };

    dataStatus.textContent = '登録中...';

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error (result.error || '登録に失敗しました。');
        }

        form.reset();
        submitStaus.textContent = `ユーザー名：${result.name} 登録に成功しました。`;
        await loadUsers();
    } catch (error) {
        submitStaus.textContent = `ユーザー登録に失敗しました。：${error.message}`;
    }
});

//ユーザーを検索する機能
search.addEventListener('input', () => {
    loadUsers();
});

//ユーザー情報を再読み込みする機能
reloadButton.addEventListener('click',() => {
    loadUsers();
});

// 編集するボタンをクリックするとモーダル表示する機能
openEditModalButton.addEventListener('click',() => {
    //　選択したユーザーのIDを取得する
    const selectedEditRadio = document.querySelector('input[name="user-select"]:checked');
    console.log('選択したユーザーが存在するか確認:',selectedEditRadio);
    const selectedUserId = selectedEditRadio.value;
    //　ReferenceError: user is not defined ユーザー情報をどこから渡すのか？
    // const seletedUser = users.find(user => user.id === selectedUserId);
    editModal.showModal();
})

// モーダルを閉じる機能
closeEditModalButton.addEventListener('click',() => {
    editModal.close();
})

// ユーザー情報を更新する機能

loadUsers();