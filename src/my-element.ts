import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { query } from "lit/decorators/query.js";
import * as d3 from "d3";

const draw = (context, x0, y0, cpx1, cpy1, cpx2, cpy2, x, y) => {
  context.moveTo(x0, y0);
  context.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
  // etc.
  return context; // not mandatory, but will make it easier to chain operations
};

const update = (chart, points, labels, lines, drawPath) => {
  d3.select(chart).select(".u-path").attr("d", drawPath());

  d3.select(chart)
    .selectAll(".u-point")
    .data(points)
    .join((enter) =>
      enter
        .append("g")
        .classed("u-point", true)
        .call((g) => {
          g.append("circle").attr("r", 3);
          g.append("text")
            .text((d, i) => labels[i])
            .attr("dy", (d) => (d[1] > 100 ? 15 : -5));
        })
    )
    .attr("transform", (d) => {
      return `translate(${d})`;
    });
};

function draggable(chart, points, labels, lines, draw) {
  update(chart, points, labels, lines, draw);

  const dist = (p, m) => {
    return Math.sqrt((p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2);
  };

  var subject, dx, dy;

  function dragSubject(event) {
    const p = d3.pointer(event.sourceEvent, chart);
    subject = d3.least(points, (a, b) => dist(p, a) - dist(p, b));
    if (dist(p, subject) > 48) subject = null;
    if (subject)
      d3.select(chart).style("cursor", "hand").style("cursor", "grab");
    else d3.select(chart).style("cursor", null);
    return subject;
  }

  d3.select(chart)
    .on("mousemove", (event) => dragSubject({ sourceEvent: event }))
    .call(
      d3
        .drag()
        .subject(dragSubject)
        .on("start", (event) => {
          if (subject) {
            d3.select(chart).style("cursor", "grabbing");
            dx = subject[0] - event.x;
            dy = subject[1] - event.y;
          }
        })
        .on("drag", (event) => {
          if (subject) {
            subject[0] = event.x + dx;
            subject[1] = event.y + dy;
          }
        })
        .on("end", () => {
          d3.select(chart).style("cursor", "grab");
        })
        .on("start.render drag.render end.render", () =>
          update(chart, points, labels, lines, draw)
        )
    );
}

@customElement("my-element")
export class MyElement extends LitElement {
  @query("#my-container")
  container!: HTMLElement;

  @query(".my-svg")
  svg!: HTMLElement;

  static styles = css`
    .my-svg {
      overflow: visible;
    }
  `;

  updated() {
    const path = d3.path();
    const x0 = 40;
    const y0 = 100;
    const cpx1 = 150;
    const cpy1 = 280;
    const cpx2 = 150;
    const cpy2 = 30;
    const x = 350;
    const y = 50;

    d3.select(this.container)
      .append("svg")
      .classed("my-svg", true)
      .call((svg) => {
        svg
          .append("path")
          .style("stroke", "black")
          .style("fill", "none")
          .attr("d", draw(path, x0, y0, cpx1, cpy1, cpx2, cpy2, x, y))
          .classed("u-path");
      });

    const points = [
      [x0, y0],
      [cpx1, cpy1],
      [cpx2, cpy2],
      [x, y],
    ];
    const labels = ["Start", "Control1", "Control2", "End"];
    const lines = [
      [points[0], points[1]],
      [points[2], points[3]],
    ];

    const drawPath = () => {
      const path = d3.path();
      path.moveTo(...points[0]);
      path.bezierCurveTo(...points[1], ...points[2], ...points[3]);
      return path;
    };

    draggable(this.svg, points, labels, lines, drawPath);
  }

  render() {
    return html`<div id="my-container"></div>`;
  }
}
