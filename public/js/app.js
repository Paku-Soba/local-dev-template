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
const editUserId = document.getElementById('edit-user-id');
const editUserName = document.getElementById('edit-name');
const editUserEmail = document.getElementById('edit-email');
const editForm = document.getElementById('edit-user-form');
const closeEditModalButton = document.getElementById('close-edit-modal');
//削除するモーダル関連要素
const openDeleteModalButton = document.getElementById('open-delete-modal-button');
const deleteModal = document.getElementById('delete-modal');
const closeDeleteModalButton = document.getElementById('close-delete-modal');
const deleteUserTableList = document.getElementById('user-delet-table');
const deleteButton = document.getElementById('delete-submit');
// 削除対象ユーザー情報格納用_変数宣言及び初期化
let setUserId = "";
let setUserName = "";
let setUserEmail = "";
let deleteUsers = [];




//ユーザー情報を取得する機能
async function loadUsers() {
    //指定したinputID要素の値取得を確認する
    console.log(search.value);
    const query = search.value.trim();
    const url = query? `/api/users?q=${encodeURIComponent(query)}`:'/api/users';

    dataStatus.textContent = '読み込み中...';

    try {
        const response = await fetch(url);
        console.log(url);
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
            // TODO. ユーザー情報が削除できるUI画面要素を作ろう
            //　ユーザー情報を削除するためのcheckbox追加
            const tdDelete = document.createElement('td');
            const deleteCheckBox = document.createElement('input');
            deleteCheckBox.type = 'checkbox';
            deleteCheckBox.name = 'delete-select';
            deleteCheckBox.value = user.id;
            
            editCheckRadio.addEventListener('click', () => {
                console.log('編集対象ユーザーID:', user.id);
                console.log('ユーザーIDが入っているか値確認:', editCheckRadio.value);
            });
            deleteCheckBox.addEventListener('click', () => {
                console.log('削除対象ユーザーID:', user.id);
                console.log('ユーザーIDが入っているか値確認:', deleteCheckBox.value);
                // TODO. 削除するユーザー情報を渡す方法検証する
                console.log('checkBoxを選択したユーザー情報の名前とメールアドレス確認:',tdName.textContent,tdEmail.textContent);
                deleteUsers.push({setUserId:deleteCheckBox.value,setUserName:tdName.textContent,setUserEmail:tdEmail.textContent}),
                console.log('削除対象のユーザー情報を確認:',deleteUsers);
            })
            tdAction.appendChild(editCheckRadio);
            tdDelete.appendChild(deleteCheckBox);
            //親要素である<tr>に、作成した子要素<td>を追加する
            tr.append(tdName,tdEmail,tdAction,tdDelete);

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

        // TODO. ラジオボタンで選択したユーザー情報をモーダルダイアログに渡す
        // 編集するボタンをクリックするとモーダル表示する機能
        openEditModalButton.addEventListener('click',() => {
            //　ラジオボタンで選択したユーザーを取得する
            const selectedEditRadio = document.querySelector('input[name="user-select"]:checked');
            console.log('選択したユーザーを確認:',selectedEditRadio);

            if(!selectedEditRadio) {
                alert('編集するユーザーを選択してください。');
                return;
            }
            const selectedUserId = selectedEditRadio.value;
            // フロントのメモリ上のusers配列から選択したユーザー情報の存在確認を行う
            const seletedUser = users.find(user => user.id === selectedUserId);
            console.log('モーダル表示前に選択したユーザー情報が存在するか確認:',seletedUser);
            if (!seletedUser) {
                alert('選択したユーザーが存在しません。');
                return;
            }
            // 編集可能なフォームに選択したユーザー情報を渡す
            editUserId.value = seletedUser.id;
            editUserName.value = seletedUser.name;
            editUserEmail.value = seletedUser.email;
            editModal.showModal();
        })

        // TODO. チェックボックスを選択したユーザー情報をモーダルダイアログに渡す
        // 削除するボタンをクリックするとモーダル表示する機能
        openDeleteModalButton.addEventListener('click', () => {
            const fragment = document.createDocumentFragment();
            // TODO.配列の中に格納したデータの取り出しを行う
            for (const deleteUser of deleteUsers) {
                console.log('配列の中のオブジェクトデータ取得確認:',deleteUser.setUserId);
                if (!deleteUser.setUserId){
                    alert('削除するユーザーを選択してください。')
                    return;
                }
                // TODO.削除対象のユーザー情報をHTMLテーブル要素に反映する
                const tr = document.createElement('tr');
                tr.dataset.id = deleteUser.setUserId;

                const tdUserName = document.createElement('td');
                tdUserName.textContent = deleteUser.setUserName;

                const tdUserEmail = document.createElement('td');
                tdUserEmail.textContent = deleteUser.setUserEmail;

                tr.append(tdUserName,tdUserEmail);
                console.log('trの中身確認:',tr);
                fragment.appendChild(tr);    
            }
            // HTMLテーブル要素に追加した内容をDOMへ反映
            deleteUserTableList.innerHTML= '';
            deleteUserTableList.appendChild(fragment);
            deleteModal.showModal();
        })

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

// TODO.モーダルを閉じる機能をまとめる　
closeEditModalButton.addEventListener('click',() => {
    editModal.close();
});
closeDeleteModalButton.addEventListener('click',() => {
    deleteModal.close();
});


// TODO. モーダルダイアログの「保存」ボタンをクリックしたらユーザー情報を更新する
// ユーザー情報を更新する機能
editForm.addEventListener('submit', async event => {
   console.log('更新フォーム送信_イベント呼び出し確認');
    event.preventDefault();
    const userId = editUserId.value;
    const payload = {
        //フロント側よりサーバ側へidの渡し方を検証する
        id: userId,
        name: editUserName.value.trim(),
        email: editUserEmail.value.trim()
    };   
    console.log('保存処理イベント発火確認_編集するユーザー情報確認:',userId,payload);

   try {
    // 更新API呼び出し_サーバーとの通信が発生する
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    const editResult = await response.json();
    // レスポンス内容を明示的に確認
    console.log('PATCH response:', editResult);
    console.log('response.ok:', response.ok, 'status:',response.status);
    if (!response.ok) {
            throw new Error (editResult.error || 'ユーザー情報の編集ができませんでした。');
        }
    await loadUsers();
   } catch (error) {
    console.log(error)
    alert(`ユーザー情報の編集ができませんでした。: ${error.message}`);

   }
   // 更新フォームの値をクリアする
   editForm.reset();
   // 更新が成功したら、ラジオボタンをクリアする
   const editCheckRadios = document.querySelectorAll('input[name="user-select"]');
   editCheckRadios.forEach(radio => radio.checked = false);
   editModal.close();
})

// TODO. 削除モーダルダイアログの「はい」ボタンをクリックしたらユーザー情報を削除する
deleteButton.addEventListener('click', async event => {
    console.log('削除対象ユーザー情報_イベント呼び出し確認');
    event.preventDefault();
    for (const deleteUser of deleteUsers) {
    const payload = {
        id: deleteUser.setUserId,
        name: deleteUser.setUserName,
        email: deleteUser.setUserEmail
    };
    console.log('削除するイベント発火確認_削除するユーザー情報確認:',payload);

    try{
    //　削除API呼び出し_サーバーとの通信が発生する
    const response = await fetch(`/api/users/${encodeURIComponent(deleteUser.setUserId)}`, {
        method: 'DELETE',
        headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
    });
    const deleteResult = await response.json();
    //レスポンス内容を明示的に確認
    console.log('DELETE response:', deleteResult);
    console.log('response.ok:', response.ok, 'status:',response.status);
        
    } catch (error) {
        console.log(error);
        alert(`ユーザー情報を削除できませんでした。:${error.message}`);
    }
    }
    const deleteCheckBox = document.querySelectorAll('input[name="delete-select"]');
    deleteCheckBox.forEach(checkBox => checkBox.checked = false);
    deleteModal.close();
    alert(`ユーザー情報を削除できたよ♪`);
})

loadUsers();