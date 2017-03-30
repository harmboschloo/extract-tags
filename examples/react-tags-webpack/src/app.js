import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'extract-tags/react';

styled.global`
  div {
    font-size: 24px;
    color: #00f;
  }
`;

const Works = styled.div`
  font-weight: bold;
  color: #0f0;
`;

ReactDOM.render(
  <div>
    <div>Hello styled react tags</div>
    <Works>Works!</Works>
  </div>,
  document.getElementById('root')
);
