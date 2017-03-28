import css from 'extract-tags/css'

css.global`
  div {
    font-size: 2em;
    color: #00f;
  }
`;

const className = css.local`
  font-weight: bold;
  color: #0f0;
`;


const hello = document.createElement('div');
hello.innerHTML = 'Hello css tags';
document.body.appendChild(hello);

const success = document.createElement('div');
success.setAttribute('class', className);
success.innerHTML = 'Works!';
document.body.appendChild(success);
