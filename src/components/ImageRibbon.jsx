import React from 'react';
import './ImageRibbon.css';

const images = [
  { src: '/images/imagen1.jpeg', alt: 'Proyecto 1' },
  { src: '/images/imagen2.jpeg', alt: 'Proyecto 2' },
  { src: '/images/imagen3.jpeg', alt: 'Proyecto 3' },
  { src: '/images/imagen4.jpeg', alt: 'Proyecto 4' },
  { src: '/images/imagen5.jpeg', alt: 'Proyecto 5' },
  { src: '/images/imagen6.jpeg', alt: 'Proyecto 6' },
];

function ImageRibbon() {
  return (
    <section className="image-ribbon" aria-label="Cinta de imagenes destacadas">
      <div className="image-ribbon__viewport">
        <div className="image-ribbon__track">
          <div className="image-ribbon__group">
            {images.map((image, index) => (
              <article className="image-ribbon__item" key={`first-${index}`}>
                <img src={image.src} alt={image.alt} className="image-ribbon__image" />
              </article>
            ))}
          </div>
          <div className="image-ribbon__group" aria-hidden="true">
            {images.map((image, index) => (
              <article className="image-ribbon__item" key={`second-${index}`}>
                <img src={image.src} alt="" className="image-ribbon__image" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ImageRibbon;
