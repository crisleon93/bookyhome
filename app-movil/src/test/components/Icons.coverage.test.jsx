// @vitest-environment jsdom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Icons from '../../components/Icons';

vi.mock('react-native-svg', () => {
  const Shape = ({ children, ...props }) => React.createElement('svg', props, children);
  const shape = (tag) => (props) => React.createElement(tag, props);
  return {
    default: Shape,
    Circle: shape('circle'),
    Line: shape('line'),
    Path: shape('path'),
    Polyline: shape('polyline'),
    Polygon: shape('polygon'),
    Rect: shape('rect'),
  };
});

describe('mobile icons', () => {
  afterEach(cleanup);

  it('renderiza todos los iconos y aplica sus variantes configurables', () => {
    const entries = Object.entries(Icons);
    const { container } = render(
      <>
        {entries.map(([name, Icon]) => (
          <Icon key={name} size={32} color="#123456" />
        ))}
        <Icons.IconStar size={16} color="#ABCDEF" filled />
        <Icons.IconBook size={18} color="#334455" strokeWidth={3} />
      </>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(entries.length + 2);
    expect(container.querySelector('svg').getAttribute('width')).toBe('32');
    expect(container.querySelector('svg').getAttribute('stroke')).toBe('#123456');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(entries.length);
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
  });
});
