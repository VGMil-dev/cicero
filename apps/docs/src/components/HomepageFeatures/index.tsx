import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Problema y propuesta',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Cicero busca mejorar la oratoria detectando muletillas y ofreciendo
        feedback util a partir de audio grabado localmente.
      </>
    ),
  },
  {
    title: 'Arquitectura y decisiones',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        La documentacion explica la arquitectura objetivo, las decisiones clave
        y los trade-offs tecnicos del proyecto.
      </>
    ),
  },
  {
    title: 'Estado actual y transicion',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        El sitio distingue entre vision objetivo, estado actual y decisiones en
        transicion para que el contexto sea confiable.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
