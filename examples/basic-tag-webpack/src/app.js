import css from 'extract-tags'

css`
  div {
    font-size: 2em;
    color: #00f;
  }
`;

const classNames = css`
  :local(.success) {
    font-weight: bold;
    color: #0f0;
  }
`;

const hello = document.createElement('div');
hello.innerHTML = 'Hello tags';
document.body.appendChild(hello);

const success = document.createElement('div');
success.setAttribute('class', classNames.success);
success.innerHTML = 'Works!';
document.body.appendChild(success);
