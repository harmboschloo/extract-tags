const component = () => {
  const element = document.createElement('div');

  element.innerHTML = ['Hello','tags'].join(' ');

  return element;
}

document.body.appendChild(component());
