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
        userTableList.innerHTML= '';

        if (!Array.isArray(users) || users.length === 0) {
            dataStatus.textContent = 'ユーザーが見つかりません。';
            return;
        }

        dataStatus.textContent = `${users.length}件取得しました。`;
        // ユーザー情報をリストに表示するロジック
        for(const user of users) {
            const li = document.createElement('li');
            li.textContent = `${user.name}(${user.email})`;
            userList.appendChild(li);
        }
        // リストで表示したユーザー情報をテーブルに表示するロジック
        for(const user of users) {
            const userName = document.createElement('td');
            const userEmail = document.createElement('td');
            userName.textContent = `${user.name}`;
            userEmail.textContent = `${user.email}`;
            userTableList.appendChild(userName);
            userTableList.appendChild(userEmail);
        }

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