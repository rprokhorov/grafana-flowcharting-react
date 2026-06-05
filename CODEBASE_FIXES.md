# Codebase fixes

Проверка выполнена 2026-06-06 для текущего состояния репозитория.

> **Статус (обновлено 2026-06-06):** исправлены все «чистые баги» P0/P1 — 12 пунктов,
> каждый отмечен `[x]` с хешем коммита. Остаются 5 пунктов недоделанного функционала
> (LinkMap, CSV-источник, date thresholds, map options в UI, EventMap/TextMap modes)
> и все пункты P2 — они помечены `[ ]`.

Запущенные проверки:

- `npm test` - успешно: 5 suites, 29 tests.
- `npx tsc --noEmit` - успешно.
- `npm run build` - успешно, но webpack выдает предупреждения по размеру бандла.

E2E не запускались: по `TESTING.md` им нужен заранее поднятый Grafana container.

## P0 / критично

- [x] Починить LinkMap: сейчас ссылки фактически не применяются к ячейкам. (реализовано)
  `src/core/drawio/XCell.ts:102` только пишет URL во внутреннее поле, а `restoreLink()` на `src/core/drawio/XCell.ts:107` пустой. При этом UI и `LinkMap` создают ожидание, что ссылка будет работать.

- [x] Исправить сброс стилей ячеек, чтобы правила не оставляли старые цвета/стили после исчезновения метрики или смены условий. (f0c3b21)
  `RuleEngine.applyAll()` сбрасывает `restoreAllStyles()` на `src/core/rules/RuleEngine.ts:52`, но `XCell.restoreAllStyles()` на `src/core/drawio/XCell.ts:138` восстанавливает только ключи, которые были в исходном style. Новые ключи, добавленные правилом, могут остаться навсегда.

- [x] Обработать все метрики, совпавшие с rule pattern, либо явно запретить multiple match. (c524a60)
  Сейчас `RuleEngine.applyAll()` берет только `matchedMetrics[0]` на `src/core/rules/RuleEngine.ts:70`, хотя `MetricProcessor.matchMetrics()` возвращает массив. Это ломает сценарии regex-паттернов и много-серийные tooltip.

- [x] Реализовать CSV-источник или убрать его из UI. (реализовано)
  `FlowchartsEditor` показывает выбор `CSV` на `src/components/editors/FlowchartsEditor.tsx:9`, но редактор содержит только XML textarea, а `XGraph._display()` на `src/core/drawio/XGraph.ts:291` обрабатывает только `xml`.

- [x] Добавить UI и применение date thresholds. (реализовано)
  `RuleEditor` разрешает выбрать `Date` на `src/components/editors/RuleEditor.tsx:20`, но `ThresholdEditor` рендерит только number/string и не использует `dateData`.

- [x] Исправить stale active flowchart index при изменении списка диаграмм. (633cc88)
  `useFlowchartManager()` держит отдельный React `activeIndex` на `src/hooks/useFlowchartManager.ts:25`; если список сократится, `FlowchartManager` сбросит свой индекс, но hook продолжит читать `manager.getFlowcharts()[activeIndex]`.

- [x] Исправить regex cache для `/pattern/g` и `/pattern/y`. (e71973f)
  `regexTest()` на `src/utils/regexCache.ts:32` переиспользует один и тот же RegExp. У global/sticky regex меняется `lastIndex`, из-за чего повторные проверки могут чередовать true/false.

## P1 / высокий приоритет

- [ ] Доделать EventMap: большая часть настроек не работает или не настраивается.
  `EventMapsEditor` на `src/components/editors/MappingEditor.tsx:204` редактирует только pattern/value, а `EventMap.apply()` игнорирует `eventOn` и не откатывает стиль при false.

- [x] Вернуть настройки match options для map groups: `identByProp`, `metadata`, `enableRegEx`. (реализовано)
  Типы и `XCell.getDefaultValues()` поддерживают match по id/value/metadata, но `RuleEditor` передает в `MappingEditor` только `dataList`, без `options`.

- [ ] Доделать TextMap modes.
  `TextMap.apply()` не различает `wc` и `co`, `textReplace: 'as'` работает как обычная замена, а `anl` из типов не реализован. UI также не дает редактировать `textReplace` и `textPattern`.

- [x] Починить `bgColor`. (2d35516)
  `FlowChartRenderer` передает `bgColor` в `XGraph`, но `_applyOptions()` его игнорирует, а `_updateOptions()` на `src/core/drawio/XGraph.ts:394` перезаписывает `container.style.backgroundColor` значением из mxGraph.

- [x] После deferred stencil refresh повторно применять rules. (48fe11e)
  `XGraph._scheduleStencilRefresh()` на `src/core/drawio/XGraph.ts:101` может заново создать `xcells`, но `FlowChartRenderer.applyRules()` вызывается только сразу после `initGraph()` и при изменении metrics/rules. Диаграмма, которая сначала загрузилась без ячеек, может остаться без раскраски.

- [x] Чистить timers при unmount/free. (77fad4c)
  `XGraph` ставит `setTimeout` для stencil refresh и анимаций на `src/core/drawio/XGraph.ts:117`, `src/core/drawio/XGraph.ts:194`, `src/core/drawio/XGraph.ts:220`, но не хранит timer ids и не отменяет их в `free()`.

- [x] Исправить zoom/fit edge cases. (02d1ad4)
  `_fitDisplay()` делит на размеры bounds/container без защиты от 0 на `src/core/drawio/XGraph.ts:409`, а `_zoomPointer()` сначала clamp-ит `factor`, затем перезаписывает его на `src/core/drawio/XGraph.ts:438`.

- [x] Сделать ошибки загрузки draw.io видимыми пользователю. (de905de)
  `useDrawioEngine()` возвращает только boolean и логирует ошибку в console на `src/hooks/useDrawioEngine.ts:28`; `StatusOverlay` имеет prop `error`, но панель его никогда не передает.

- [x] Починить `DrawioEngine.isValidXml()` cleanup. (2ae6e4b)
  В `src/core/drawio/DrawioEngine.ts:146` graph создается до потенциально падающих операций, но `endUpdate()` и `destroy()` не находятся в `finally`.

- [x] Убрать дублирование значения в tooltip без series/sparkline. (2ae6e4b)
  `DiagramTooltip` рендерит `.fc-tooltip-value` в двух ветках: `src/components/DiagramTooltip.tsx:65` и `src/components/DiagramTooltip.tsx:77`.

- [x] Добавить отсутствующий logo asset или исправить `plugin.json`. (2236ed9)
  `plugin.json` ссылается на `img/logo.svg`, но такого файла нет ни в исходниках, ни в `dist`.

## P2 / средний приоритет

- [ ] Уменьшить размер сборки.
  `npm run build` предупреждает о `module.js` 1.78 MiB, `viewer-static.min.js` 3.22 MiB и множестве больших stencil XML. Нужно lazy-load для tooltip chart/recharts и выборочную упаковку stencils.

- [ ] Пересмотреть `eval` и CDN fallback с точки зрения deployment/security.
  `DrawioEngine._evalLib()` использует `globalThis.eval()` на `src/core/drawio/DrawioEngine.ts:216`, а stencil loader fallback ходит на `https://stencils.drawio.com`. Это может не работать при строгом CSP и в air-gapped Grafana.

- [ ] Сделать `FlowchartsEditor.openDrawioEditor()` безопаснее.
  Сейчас `postMessage` отправляется с target `'*'`, а listener удаляется только при `exit`; если окно закрыть вручную, listener останется.

- [ ] Реиндексировать threshold levels после удаления.
  `ThresholdEditor.removeNumberTH()` и `removeStringTH()` удаляют элемент, но не пересчитывают `level`, из-за чего уровни могут стать дырявыми или задвоиться после следующего добавления.

- [ ] Не скрывать реальные ошибки renderer-а общим catch.
  `_patchDrawShape()` глушит ошибки, если сообщение содержит `undefined`, на `src/core/drawio/DrawioEngine.ts:305`. Это может маскировать настоящие дефекты mxGraph/rendering.

- [ ] Согласовать options editor с типами.
  В `TIRuleData` есть `hidden`, `invert`, `column`, tooltip settings, value/range mappings и другие поля, но текущий `RuleEditor` не дает большую часть из них редактировать.

- [ ] Добавить тесты на уже найденные gaps.
  Минимум: LinkMap, stale style reset, multiple matched metrics, regex `/g`, date thresholds UI, event maps, flowchart index shrink, missing logo/build validation.
