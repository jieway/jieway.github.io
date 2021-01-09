<template>
  <div class="container">
    <div id="name-container">
      <img id="avatar" src="./../assets/images/av.png" alt="avatar" />
      <h1>Weijiew</h1>
    </div>
    <div class="title-desc-container">

      <a id="github" href="https://github.com/weijiew" target="_blank" rel="noopener noreferrer"
        ><img class="title-font" src="./../assets/images/github.svg" />Developer</a
      >
      <span>/</span>
      <a id="blog" href="https://cs.weijiew.com" target="_blank" rel="noopener noreferrer"
        ><img class="title-font" src="./../assets/images/hero.png" />Notes</a
      >
      <span>/</span>
      <a id="blog" href="https://blog.weijiew.com" target="_blank" rel="noopener noreferrer"
        ><img class="title-font" src="./../assets/images/zeit.svg" />Blogger</a
      >


<!--
      <span>/</span>
      <a id="sspai" href="https://sspai.com/u/spencerwoo/posts" target="_blank" rel="noopener noreferrer"
        ><img class="title-font" src="./../assets/images/sspai.svg" />Writer</a
      >
-->
 
    </div>

    <div class="article">
      <h2>👋 Hi there </h2>
      &ensp;&ensp;&ensp;&ensp;还没想好怎么写，先放着。

      <!--
      <p>
        I'm <i>Spencer Woo</i> with the ID <i>spencerwoo</i>. Some other variations:
        <a href="https://twitter.com/realSpencerWoo" target="_blank" rel="noopener noreferrer">@realSpencerWoo</a> /
        <a href="https://weibo.com/spencerwoo" target="_blank" rel="noopener noreferrer">@SpencerWoo</a> /
        <a href="https://github.com/spencerwooo" target="_blank" rel="noopener noreferrer">@spencerwooo</a>. You may
        know me from GitHub / Jike / SSPAI or other places. Yes, those are also me.
      </p>
      -->
      <!--
      <h2>Academics</h2>
      <ul>
        <li>
          🍭 Fresh graduate at 🇨🇳
          <a href="http://www.bit.edu.cn/" target="_blank" rel="noopener noreferrer">Beijing Institute of Technology</a
          >, <i>BSc in Computer Science</i>. Currently a research assistant at Data & AI security Lab, BIT.
        </li>
        <li>
          🙇 Prospective student at 🇬🇧
          <a href="https://www.gla.ac.uk/" target="_blank" rel="noopener noreferrer">the University of Glasgow</a>,
          1/2021 entry,
          <i
            ><a
              href="https://www.gla.ac.uk/postgraduate/taught/computingsciencemsc/"
              target="_blank"
              rel="noopener noreferrer"
              >MSc in Computing Science</a
            ></i
          >.
        </li>
        <li>🔭 <b>Fields of interest:</b> Adversarial attacks / Image classification / AI security.</li>
      </ul>
      -->

      <h2>🧐 Current</h2>
          &ensp;&ensp;&ensp;&ensp;
          2021.01.15 之前把 cs61a 做完。（终于有自主学习的时间了！��）
      <h2>🔨 Languages and Tools</h2>
          &ensp;&ensp;&ensp;&ensp;
        <a><img src="https://img.shields.io/badge/java-%23ED8B00.svg?&style=for-the-badge&logo=java&logoColor=white" alt="copyright"/></a>   
        <a><img src="https://img.shields.io/badge/python-%233776AB.svg?&style=for-the-badge&logo=python&logoColor=white" alt="copyright"/></a>
        <a><img src="https://img.shields.io/badge/C-%23A8B9CC.svg?&style=for-the-badge&logo=c&logoColor=black" alt="copyright"/></a>
        <a><img src="https://img.shields.io/badge/c++-%2300599C.svg?&style=for-the-badge&logo=c%2b%2b&logoColor=white" alt="copyright"/></a>
        <a><img src="https://img.shields.io/badge/javascript-%23F7DF1E.svg?&style=for-the-badge&logo=javascript&logoColor=black&labelColor=f7df1e" alt="copyright"/></a>
        <a><img src="https://img.shields.io/badge/markdown-%23000000.svg?&style=for-the-badge&logo=markdown&logoColor=white" alt="copyright"/></a>

        <br/>
        &ensp;&ensp;&ensp;&ensp;
        <a><img src="https://img.shields.io/badge/Visual%20Studio%20Code-%23007ACC.svg?&style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="copyright"/></a>
        <a><img src="https://img.shields.io/badge/git-%23f05032.svg?&style=for-the-badge&logo=git&logoColor=white" alt="copyright"/></a>

      <h2>📫 How to reach me</h2>
      <ul>
      &ensp;&ensp;
            <a href="mailto:jiewei314@gmail.com"><img src="https://img.shields.io/badge/email-jiewei314@gmail.com-blueviolet?style=for-the-badge&logo=google&color=fd79a8" alt="copyright"/></a>
      </ul>
    </div>
  </div>
</template>

<style lang="css" scoped>
#name-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

#avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  margin-right: 12px;
}

#copyright:hover {
  border: none;
}

.title-font {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.title-desc-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 8px 0;
}

.title-desc-container a {
  display: flex;
  align-items: center;
}

.title-desc-container span {
  margin: 0px 4px;
}

.title-desc-container #github {
  color: #24292e;
}

.title-desc-container #sspai {
  color: #ca2c2a;
}

.title-desc-container #blog {
  color: #0070f3;
}
</style>
