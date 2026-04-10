import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/data';
import styles from './BlogSection.module.css';

export default function BlogSection() {
  return (
    <section className={styles.blogSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Latest from Our Blog</div>
        <Link href="/blog" className={styles.viewAll}>All Posts →</Link>
      </div>
      <div className={styles.blogGrid}>
        {BLOG_POSTS.map((post) => (
          <div key={post.title} className={styles.blogCard}>
            <div className={styles.blogThumb} style={{ background: post.bg }}>
              {post.emoji}
              <div className={styles.blogDate}>{post.date}</div>
            </div>
            <div className={styles.blogBody}>
              <div className={styles.blogTag}>{post.tag}</div>
              <div className={styles.blogTtl}>{post.title}</div>
              <div className={styles.blogExcerpt}>{post.excerpt}</div>
              <Link href="/blog" className={styles.blogRead}>Read More →</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
