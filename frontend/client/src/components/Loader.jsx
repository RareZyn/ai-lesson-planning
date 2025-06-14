import React from 'react';
import styles from './Loader.css';

/**
 * A modern, reusable loading component.
 * @param {object} props
 * @param {string} [props.text='Loading...'] - The text to display below the loader.
 * @param {string} [props.size='medium'] - The size of the loader ('small', 'medium', 'large').
 * @param {boolean} [props.fullPage=false] - If true, the loader will take up the full page with an overlay.
 */
const Loader = ({ text = 'Loading...', size = 'medium', fullPage = false }) => {
  const loaderStyle = `${styles.loader} ${styles[size]}`;

  if (fullPage) {
    return (
      <div className={styles.fullPageOverlay}>
        <div className={styles.loaderContainer}>
          <div className={loaderStyle}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
          <p className={styles.loaderText}>{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loaderContainer}>
      <div className={loaderStyle}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <p className={styles.loaderText}>{text}</p>
    </div>
  );
};

export default Loader;