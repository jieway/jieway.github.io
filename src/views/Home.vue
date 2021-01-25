<template>
  <div class="container">
    <div id="name-container">
      <img id="avatar" src="./../assets/images/av.png" alt="avatar" />
      <h1>weijiew</h1>
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
    </div>

    <div class="article">
      <h2>👋 Hi there </h2>
      <p>
          &ensp;&ensp;&ensp;&ensp;
          My Chinese name is <i>Wei Jie</i>, ID is <i>weijiew</i>.
      I am a student of Data Science and Big Data Technology, 
      currently in my junior year (2021). 
      I am preparing for my graduate exams in 2022, and I like running and reading. 
      </p>

      <h2>🧐 Current</h2>
          <p>
          &ensp;&ensp;&ensp;&ensp;
          I am currently working on CS144 and will be implementing a TCP. 
          During the winter break, I plan to do CS:APP labs, OSTEP, Python VM, and advanced math. 
          In the meantime, I will take some notes 
          <a href="http://github.com/weijiew/codestep"> here.</a> ✍
          </p>
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

      <h2><span id="busuanzi_container_site_pv"> 🤖 views: <span id="busuanzi_value_site_pv" style="color:black" ></span></span></h2>

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
