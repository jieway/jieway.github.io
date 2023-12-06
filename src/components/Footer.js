import React from 'react';

import { rhythm } from '../utils/typography';

class Footer extends React.Component {
  render() {
    return (
      <footer
        style={{
          marginTop: rhythm(2.5),
          paddingTop: rhythm(1),
        }}
      >
        <div style={{ float: 'right' }}>
          <a href="/rss.xml" target="_blank" rel="noopener noreferrer">
            rss
          </a>
        </div>
        {/* <a
          href="https://mobile.twitter.com/dan_abramov"
          target="_blank"
          rel="noopener noreferrer"
        >
          twitter
        </a>{' '}
        &bull;{' '} */}
        <a
          href="https://github.com/weijiew"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github

        </a>{' '}
        &bull;{' '}
        <a
          href="https://www.zhihu.com/people/wei-jie-66-92"
          target="_blank"
          rel="noopener noreferrer"
        >
          Zhi Hu
        </a>

      </footer>
    );
  }
}

export default Footer;
