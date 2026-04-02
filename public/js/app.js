const form = document.getElementById('user-form');
const userList = document.getElementById('user-list');
const dataStatus = document.getElementById('data-status');
const search = document.getElementById('search');
const reloadButton = document.getElementById('reload-Button');

//ユーザー情報を取得する機能
async function loadUsers() {
    const query = search.ariaValueMax.trim();
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

        for(const user of users) {
            const li = document.createElement('li');
            li.textContent = `${user.name}(${user.email})`;
            userList.appendChild(li);
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
        dataStatus.textContent = `登録成功：${result.name}`;
        await loadUsers();
    } catch (error) {
        dataStatus.textContent = `登録失敗：${error.message}`;
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

loadUsers();