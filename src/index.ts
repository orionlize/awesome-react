const div = document.createElement('div');
div.innerText = '123456';
div.id = 'root';

document.getElementById('root')?.replaceWith(div);
