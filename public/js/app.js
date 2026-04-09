const form = document.getElementById('user-form');
const userList = document.getElementById('user-list');
const userTableList = document.getElementById('user-table');
const submitStaus = document.getElementById('submit-status');
const dataStatus = document.getElementById('data-status');
const search = document.getElementById('search');
const reloadButton = document.getElementById('reload-button');

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
            const editCheckBox = document.createElement('input');
            editCheckBox.type = 'checkbox';

            editCheckBox.addEventListener('click', () => {
                console.log('編集対象ユーザーID:', user.id);
            });

            tdAction.appendChild(editCheckBox);
            //親要素である<tr>に、作成した子要素<td>を追加する
            tr.append(tdName,tdEmail,tdAction);

            return tr;
        }
        // ② パフォーマンス改善:DOM反映を一括で行う役割を担当する
        function renderUserTable(users, userTableList) {
            const fragment = document.createDocumentFragment();

            for (const user of users) {
                // 
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

// ユーザー情報を更新する機能



loadUsers();