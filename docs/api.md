# @kicearena/mondrian

seed 문자열로 같은 Mondrian 패턴을 만들고, 안정적인 key를 가진 항목을 패널에 배치하는 작은 TypeScript 패키지입니다. React, DOM, KICE 시험·제출 타입에 의존하지 않아 브라우저와 서버의 SVG 생성에서 같은 결과를 사용합니다.

## 설치

GitHub Packages의 npm registry로 배포합니다. 공개 패키지도 이 registry에서는 인증이 필요합니다. 프로젝트 `.npmrc`에 다음 설정을 두고 `read:packages` 권한의 토큰을 `NODE_AUTH_TOKEN`으로 제공합니다. 토큰 값은 파일이나 저장소에 넣지 않습니다.

```ini
@kicearena:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```sh
bun add --exact @kicearena/mondrian@0.1.2
```

## 사용 예제

```ts
import {
  generateMondrianPattern,
  placeMondrianAttempts,
  mondrianAttemptTone,
  MONDRIAN_COLUMNS,
  MONDRIAN_ROWS,
} from "@kicearena/mondrian";

const seed = "example-board";
const panels = generateMondrianPattern(seed);
const entries = [{ key: "attempt-1" }, { key: "attempt-2" }];
let placements = placeMondrianAttempts(seed, entries, new Map(), panels);

// 남아 있는 key는 같은 패널을 유지하고 새 key만 빈 패널에 배치합니다.
placements = placeMondrianAttempts(
  seed,
  [...entries, { key: "attempt-3" }],
  placements,
  panels,
);
const panel = panels[placements.get("attempt-1")!];
const tone = mondrianAttemptTone(seed, "attempt-1", panel);
console.log({ columns: MONDRIAN_COLUMNS, rows: MONDRIAN_ROWS, panel, tone });
```

패널 좌표는 grid 단위입니다. CSS Grid에서는 `gridColumn: x + 1 / span width`, `gridRow: y + 1 / span height`로 사용합니다. SVG에서는 좌표를 원하는 pixel 배율에 곱합니다.

## API와 입력 계약

| API                                                       | 역할                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `generateMondrianPattern(seed)`                           | 24×16 공간을 빈틈·중첩 없이 덮는 48개 패널 생성               |
| `placeMondrianAttempts(seed, entries, previous, panels)`  | key → panel index Map 반환; 유지된 key의 기존 위치 보존       |
| `mondrianAttemptTone(seed, key, panel)`                   | `paper`, `red`, `blue`, `yellow`, `black` 중 결정적 tone 선택 |
| `MONDRIAN_COLUMNS / MONDRIAN_ROWS / MONDRIAN_PANEL_COUNT` | 각각 24 / 16 / 48                                             |
| `MondrianPanel`                                           | `x`, `y`, `width`, `height`, 선택적인 red/blue accent         |
| `KeyedEntry`                                              | `{ key: string }`                                             |

`entries`의 key는 고유하고 업데이트 사이에서 안정적이어야 합니다. 항목은 최대 48개이며, `previous`는 같은 seed와 panels로 얻은 이전 배치입니다. 항목 선택·최신 48건 제한·정답 공개 판단·한국어 설명은 소비자가 맡습니다. 패키지는 제공된 key와 geometry만 처리합니다.

패턴 seed와 색상 seed가 분리되어 있어 항목 변화가 전체 파티션을 바꾸지 않습니다. retained key를 제외한 항목의 빈 자리는 새 key에 재사용됩니다.

## 검증

9개 unit 테스트에서 100개 seed의 전체 canvas coverage, 큰 accent 패널, 결정성, 항목 유지·교체·색상을 검증합니다. KICE의 브라우저 카드와 서버 공유 이미지도 이 패키지를 직접 소비합니다.

## 개발과 릴리스

```sh
bun install --frozen-lockfile
bun run check
bun run test
bun run build
```

Node 24와 Bun 1.3.7 환경에서 검증합니다. TypeScript 산출물은 ESM과 선언 파일이며, 소스 checkout 없이 registry 설치만으로 소비할 수 있습니다.

버전·lockfile·README를 함께 갱신하고 검증한 commit에 `v<version>` 태그를 붙입니다. 태그 workflow가 검사 후 배포합니다. 이미 발행한 버전은 tarball integrity가 같을 때만 확인하며, 바이트가 달라지면 새 버전을 발행해야 합니다. 소비자는 정확한 버전을 고정합니다.

## 라이선스

[MIT](../LICENSE). 제3자 의존성은 각각의 라이선스를 따릅니다.
