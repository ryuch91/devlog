import React from "react"
import styled from "styled-components"
import { ThemeToggler } from "gatsby-plugin-dark-mode"

// 정렬을 위해 변경될 수 있는 속성들
// margin-top : 다른 nav item들과의 위치 조정할 때
// label의 width, height : 버튼의 outer case의 크기
//  -- 그래서 label의 width와 height을 바꾸면
//  -- &:before, &:after의 width, height, top, left도 바꿔서 위치 조정을 해야함.
//  -- 또한, 토글 버튼의 크기를 바꾸면 &:after의 left 속성과
//  -- translateX transform 값도 조절해줘야 한다.
// scale값은 되도록 바꾸지 않는 것이 좋다! 
// transition : 변화 속도 조절 (400ms ~ 200ms 적당)
const DarkModeButton = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -3px;

  &:before,
  &:after {
    box-sizing: border-box;
  }

  label {
    position: relative;
    display: block;
    width: 45px;
    height: 25px;
    border-radius: 100px;
    background-color: rgb(37,37,37);
    overflow: hidden;
    cursor: pointer;

    &:before,
    &:after{
      display: block;
      position: absolute;
      content: "";
      width: 19px;
      height: 19px;
      border-radius: 50%;
      top: 3px;
      left: 3px;
      transition: 0.5s ease;
    }

    &:before{
      background-color: rgb(241, 110, 101);
    }
    &:after{
      background-color: rgb(37,37,37);
      left: -58px;
      transform: scale(0.00001);
    }
  }

  input[type="checkbox"]{
    display: none;
    &:checked + label {
      &:before {
        background-color: rgb(1, 219, 198);
        transform: translateX(20px);
      }
      &:after {
        transform: translateX(75px) scale(1);
      }
    }
  }
`

const DarkModeToggle = () => {
  return(
    <ThemeToggler>
      {({ theme, toggleTheme }) => (
        <DarkModeButton>
          <input
            type="checkbox"
            id="toggle"
            onChange={e => toggleTheme(e.target.checked ? "dark" : "light")}
            checked={theme === "dark"}
          />
          <label for="toggle"></label>
        </DarkModeButton>
      )}
    </ThemeToggler>
  )
}

export default DarkModeToggle