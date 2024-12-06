const MODEL_TYPE = {
  'Non-Learning-Model': ['LOF', 'HBOS', 'ARIMA', 'SARIMA', 'StatThreshold', 'ZMS'],
  'Machine-Learning-Model': [
    'OCSVM',
    'DeepPoint',
    'KNN',
    'Isolation Forest',
    'Spectral Residual',
    'LODA',
    'PCA',
  ],
  'Deep-Learning-Model': [
    'DAGMM',
    'iTransformer',
    'NLinear',
    'DLinear',
    'AE',
    'ModernTCN',
    'PatchTST',
    'TimesNet',
    'Anomaly Transformer',
    'VAE',
    'TranAD',
    'DualTF',
    'LSTMED',
    'DCdetector',
    'LSTM',
  ],
  'LLM-Based-Model': ['GPT4TS', 'UniTime'],
  'Pre-trained-Model': ['Timer', 'UniTS', 'TinyTimeMixer', 'Moment', 'TTM'],
}

const allData = {
  uni: { method: {}, dataset: [], metric: [], result: {} },
  multi: { method: {}, dataset: [], metric: [], result: {} },
}

const forecastTaskType = Object.keys(allData)

// const settings = ['few', 'full']
// const settings = ['full']

// loadDataAndInitializeSettings(settings)

/**
 * Loads CSV data for each setting and initializes UI elements accordingly.
 *
 * @param {string[]} settings -Literal['zero', 'few', 'full']
 *
 * For each setting, this function:
 * - Fetches the corresponding CSV file (e.g., `./setting.csv`).
 * - Parses the CSV data using Papa.parse.
 * - In the parsing complete callback:
 *   - Unchecks all score checkboxes associated with the setting.
 *   - Checks the first score checkbox.
 *   - Populates the input table with parsed data by calling `phraseInputTable`.
 *   - Toggles categories such as "Metrics", "Type", and "Horizons" for the setting.
 *   - Calls `toggleSelectAll` to set score options.
 */
function loadDataAndInitializeSettings(timeSeriesType) {
  fetch(`./${timeSeriesType}.csv`)
    .then(response => response.text())
    .then(text =>
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        complete: results => {
          for (let i1 = 1; i1 < 4; i1++) {
            const scoreBox = document.getElementById(`Score-${timeSeriesType}/${i1}`)
            if (scoreBox !== null) {
              scoreBox.checked = false
            } else {
              console.log(`no scoreBox of Score-${timeSeriesType}/${i1}`)
            }
          }
          button = document.getElementById(`Score-${timeSeriesType}/1`)
          if (button) {
            button.checked = true
          } else {
            console.log(`no button of Score-${timeSeriesType}/1`)
          }
          phraseInputTable(results.data, timeSeriesType)
          toggleCategory('Metrics', timeSeriesType, true, false)
          toggleCategory('Type', timeSeriesType, true, false)
          // toggleCategory('Horizons', setting, true, false)
          // 设置评分选项
          toggleSelectAll(true, timeSeriesType)
          // display(setting)
        },
      })
    )
}

function phraseInputTable(input, setting) {
  // phrase method
  const [
    contactTexts,
    contactUrls,
    paperUrls,
    codeUrls,
    publications,
    bibs,
    years,
    parametersList,
    methods,
  ] = input

  const keys = Object.keys(methods).filter(item => item !== 'Dataset-Quantity-metrics')
  // 存入all_data
  keys.forEach(method => {
    allData[setting].method[method] = {
      contact_text: contactTexts[method] || '',
      contact_url: contactUrls[method],
      paper_url: paperUrls[method],
      code_url: codeUrls[method],
      publication: publications[method],
      bib: bibs[method],
      year: years[method],
      parameters: parametersList[method],
    }
  })

  // Phrase result
  for (let i = 8; i < input.length; i++) {
    const entry = input[i]
    const key = entry['Dataset-Quantity-metrics']
    if (!key) continue

    const [data, metric] = key.split('-96-')

    if (!allData[setting].dataset.includes(data)) {
      allData[setting]['dataset'].push(data)
    }
    if (!allData[setting].metric.includes(metric)) {
      allData[setting]['metric'].push(metric)
    }
    allData[setting].result[key] = entry
  }

  // 按大类分组数据集
  const groupedDatasets = allData[setting].dataset.reduce((acc, dataset) => {
    const [category, name] = dataset.replace(' ', '_').split('/')
    if (!acc[category]) acc[category] = []
    acc[category].push(name)
    return acc
  }, {})

  // 按数据集数量排序
  const sortedCategories =
    setting !== 'zero'
      ? Object.keys(groupedDatasets).sort(
          (a, b) => groupedDatasets[b].length - groupedDatasets[a].length
        )
      : [
          'Traffic',
          'Energy',
          'Environment',
          'Economic',
          'Nature',
          'Health',
          'Stock',
          'Banking',
          'Web',
          'Electricity',
        ]

  // 数据集选择区域
  const container = document.getElementById(`dataset-container-${setting}`)
  sortedCategories.forEach(category => {
    // 大标题
    const categoryDiv = document.createElement('div')
    categoryDiv.className = 'category'

    const categoryLabel = document.createElement('h3')
    const categoryCheckbox = document.createElement('input')
    categoryCheckbox.type = 'checkbox'
    categoryCheckbox.id = `select-all-${category}-${setting}`
    categoryCheckbox.addEventListener('change', () =>
      toggleCategory(category, setting, categoryCheckbox.checked)
    )

    categoryLabel.appendChild(categoryCheckbox)
    categoryLabel.appendChild(document.createTextNode(` ${category.replace('_', ' ')}`))
    categoryDiv.appendChild(categoryLabel)

    const datasetContainer = document.createElement('div')

    // 添加小标题
    groupedDatasets[category].forEach(name => {
      // name = name.replace('_', '-')
      const checkboxItem = document.createElement('div')
      checkboxItem.className = 'checkbox-item'

      // 多选框
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.id = `${category}-${setting}/${name}`
      checkbox.value = `${category}-${setting}/${name}`
      checkbox.className = `checkbox-${category}-${setting}`
      checkbox.addEventListener('change', handleChildCheckboxChange)

      // 标签
      const label = document.createElement('label')
      // label.htmlFor = `${category}/${name}`
      label.htmlFor = checkbox.id
      label.textContent = name

      checkboxItem.appendChild(checkbox)
      checkboxItem.appendChild(label)
      datasetContainer.appendChild(checkboxItem)
    })

    categoryDiv.appendChild(datasetContainer)
    container.appendChild(categoryDiv)
  })
}

// 子复选框改变事件
function handleChildCheckboxChange(event) {
  const checkbox = event.target
  const [_, category, setting] = checkbox.className.split('-')

  // score 是单选框
  if (category === 'Score') {
    checkbox.checked = true
    const checkboxId = checkbox.value
    // 获取所有相关的Score复选框并取消选中非当前选中的
    for (let i = 1; i < 4; i++) {
      const scoreBox = document.getElementById(`Score-${setting}/${i}`)
      if (scoreBox && scoreBox.value !== checkboxId) {
        scoreBox.checked = false
      }
    }
  } else {
    // 处理多选框的父级逻辑
    updateParentCheckbox(category, setting)
  }
  submitSelection(setting)
}

/**
 * Toggles the checked state of checkboxes for a specific category and setting.
 *
 * @param {string} category - The category identifier.
 * @param {string} setting - The setting identifier.
 * @param {boolean} isChecked - Determines whether the checkboxes should be checked or unchecked.
 * @param {boolean} [flush=true] - Whether to submit the selection after toggling.
 */
function toggleCategory(category, setting, isChecked, flush = true) {
  const checkboxes = document.querySelectorAll(`.checkbox-${category}-${setting}`)
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked
  })
  if (flush) submitSelection(setting)
}

/**
 * Toggles the selection state of all checkboxes based on the selectAllCheckbox value.
 *
 * @param {boolean} selectAllCheckbox - Determines whether to select or deselect all checkboxes.
 * @param {string} setting - The specific setting identifier used to locate the relevant checkbox container.
 */
function toggleSelectAll(selectAllCheckbox, setting) {
  const container = document.getElementById(`all-${setting}`)
  const checkboxes = container.querySelectorAll('input[type="checkbox"]')
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox
  })
  submitSelection(setting)
}

function display(setting) {
  const table = `display-${setting}`
  const tableHeader = document.getElementById(table).getElementsByTagName('thead')[0]
  if (!tableHeader) return
  const tableBody = document.getElementById(table).getElementsByTagName('tbody')[0]
  const rowHeader1 = document.createElement('tr')
  const rowHeader2 = document.createElement('tr')
  const rowHeader3 = document.createElement('tr')

  const result = Object.values(allData[setting]['result'])
  result.sort((a, b) => {
    if (a['Dataset-Quantity-metrics'].split('-')[0] != b['Dataset-Quantity-metrics'].split('-')[0])
      return a < b

    if (a['Dataset-Quantity-metrics'].split('-')[1] == b['Dataset-Quantity-metrics'].split('-')[1])
      return a < b

    return (
      Number(a['Dataset-Quantity-metrics'].split('-')[1]) >
      Number(b['Dataset-Quantity-metrics'].split('-')[1])
    )
  })

  // draw table head
  const method = Object.keys(result[0])
  const td1 = document.createElement('td')
  td1.innerHTML = 'Model'
  td1.rowSpan = 2
  td1.colSpan = 2
  td1.style = 'font-weight:bold;left:0;background-color:#f2f2f2;top:0;z-index:3;'
  td1.className = 'sticky-col-header sticky-col2'
  rowHeader1.appendChild(td1)
  const td2 = document.createElement('td')
  td2.innerHTML = 'Metrics'
  td2.colSpan = 2
  td2.style = 'font-weight:bold;left:0;background-color:#f2f2f2;top:63.4px;z-index:3;'
  td2.className = 'sticky-col-header sticky-col2'
  rowHeader3.appendChild(td2)
  method = method.filter(
    a => a != 'Dataset-Quantity-metrics' && Object.keys(all_data[setting]['method']).includes(a)
  )
  method.sort((b, a) => all_data[setting]['method'][a].year - all_data[setting]['method'][b].year)
  method.forEach(key => {
    td1 = document.createElement('td')
    td1.innerHTML = key
    td1.colSpan = 2
    td1.style = 'font-weight:bold'
    rowHeader1.appendChild(td1)

    td2 = document.createElement('td')
    td2.innerHTML = all_data[setting]['method'][key].year
    td2.style = 'padding:0;font-weight:bold;'
    td2.colSpan = 2
    rowHeader2.appendChild(td2)

    const td3 = document.createElement('td')
    td3.innerHTML = 'MSE'
    td3.style = 'font-weight:bold'
    const td4 = document.createElement('td')
    td4.innerHTML = 'MAE'
    td4.style = 'font-weight:bold'
    rowHeader3.appendChild(td3)
    rowHeader3.appendChild(td4)
  })

  rowHeader1.style = 'background-color:#f2f2f2;font-weight:bold;top:0;z-index: 3;'
  rowHeader1.className = 'sticky-th'
  rowHeader2.style =
    'background-color:#f2f2f2;padding: 0px;height: 25px;font-size: 14px;font-weight:bold;top:38.4px;'
  rowHeader2.className = 'sticky-th'
  rowHeader3.style =
    'background-color:#f2f2f2;font-weight:bold;top:63.4px;box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 3px -2px;'
  rowHeader3.className = 'sticky-th'
  tableHeader.appendChild(rowHeader1)
  tableHeader.appendChild(rowHeader2)
  tableHeader.appendChild(rowHeader3)

  // draw table body
  for (let i = 0; i < result.length; i = i + 8) {
    const row1 = document.createElement('tr')
    const row2 = document.createElement('tr')
    const row3 = document.createElement('tr')
    const row4 = document.createElement('tr')

    const td = document.createElement('td')
    td.innerHTML = result[i]['Dataset-Quantity-metrics'].split('-')[0].split('/')[1]
    td.className = 'sticky-col-header sticky-col2'
    td.rowSpan = 4

    if ((i / 8) % 2 == 0) {
      td.style =
        ' writing-mode: vertical-rl; transform: rotate(180deg);margin:auto;text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale; width: 20px;background-color:#fff;left:0; '
    } else {
      td.style =
        ' writing-mode: vertical-rl; transform: rotate(180deg);margin:auto;text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale; width: 20px;background-color:#f2f2f2;left:0; '
    }
    row1.appendChild(td)
    const rowList = [row1, row2, row3, row4]
    const horizon = ['96', '192', '336', '720']
    for (let j = 0; j < rowList.length; j = j + 1) {
      const td_horizon = document.createElement('td')
      td_horizon.innerHTML = horizon[j]
      if (j % 2 == 1) {
        td_horizon.style = 'background-color:#f2f2f2;left:29.35px;'
      } else {
        td_horizon.style = 'background-color:#fff;left:29.35px ;'
      }
      td_horizon.className = 'sticky-col-header sticky-col2'
      rowList[j].appendChild(td_horizon)
      const rowData1 = result[i + 2 * j]
      method.sort((a, b) => {
        if (rowData1[a] == '-') return 1
        if (rowData1[b] == '-') return -1
        return rowData1[a] - rowData1[b]
      })
      const sort1 = structuredClone(method)
      const rowData2 = result[i + 2 * j + 1]
      method.sort((a, b) => {
        if (rowData2[a] == '-') return 1
        if (rowData2[b] == '-') return -1
        return rowData2[a] - rowData2[b]
      })
      const sort2 = structuredClone(method)
      Object.keys(rowData1).forEach(key => {
        if (key != 'Dataset-Quantity-metrics') {
          td1 = document.createElement('td')
          td1.innerHTML = processData(rowData1, key, sort1)
          rowList[j].appendChild(td1)
          td2 = document.createElement('td')
          td2.innerHTML = processData(rowData2, key, sort2)
          rowList[j].appendChild(td2)
        }
      })
      tableBody.appendChild(rowList[j])
    }
  }
}

function processData(rowData, key, sort) {
  const input = rowData[key]
  if (input == '-') return input
  if (key == sort[0]) {
    return `<b> ${parseFloat(input).toFixed(3)} </b>`
  } else if (key == sort[1]) {
    return `<p class="double-underline"> ${parseFloat(input).toFixed(3)}</p>`
  } else if (key == sort[2]) {
    return `<u> ${parseFloat(input).toFixed(3)} </u>`
  } else {
    return `${parseFloat(input).toFixed(3)}`
  }
}

/**
 * Updates the state of the parent checkbox based on the state of child checkboxes.
 *
 * @param {string} category - The category identifier used to select the related checkboxes.
 * @param {string} setting - The setting identifier used to select the related checkboxes.
 */
function updateParentCheckbox(category, setting) {
  if (category.includes('Type')) return

  const checkboxes = document.querySelectorAll(`.checkbox-${category}-${setting}`)
  const selectAllCheckbox = document.getElementById(`select-all-${category}-${setting}`)

  for (const checkbox of checkboxes) {
    if (!checkbox.checked) {
      selectAllCheckbox.checked = false
      return
    }
  }
  selectAllCheckbox.checked = true
}

function submitSelection(setting) {
  // 获取所有的 checkbox
  const checkboxes = document.querySelectorAll(`*[class*="${setting}"]`)
  const selectTypes = []
  const selectMetrics = []
  // const selectHorizons = []
  const selectDatasets = []
  let selectScore = null

  // 遍历每个 checkbox 并根据其ID进行分类
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const idParts = checkbox.id.split('/')
      if (checkbox.id.includes('Type')) {
        selectTypes.push(idParts[1].trim())
      } else if (checkbox.id.includes('Metrics')) {
        selectMetrics.push(idParts[1])
      } else if (checkbox.id.includes('Score')) {
        selectScore = idParts[1].split('-')[0]
        // } else if (checkbox.id.includes('Horizons')) {
        //   selectHorizons.push(idParts[1])
      } else {
        // dataset
        const dataset = `${checkbox.id.split('-')[0].replace('_', ' ')}/${idParts[1]}`
        selectDatasets.push(dataset)
      }
    }
  })

  // Banking/NN5-192-mae
  const rank = {}
  let selectedMethods = []

  // If no types are selected, include all types and reset datasets
  if (selectTypes.length === 0) {
    selectTypes.push(
      'Non-Learning-Model',
      'Machine-Learning-Model',
      'Deep-Learning-Model',
      'LLM-Based-Model',
      'Pre-trained-Model'
    )
    selectDatasets.length = 0
  }
  // Aggregate methods based on selected types
  selectTypes.forEach(type => {
    MODEL_TYPE[type].forEach(item => {
      selectedMethods = selectedMethods.concat([item + '(zero)', item + '(few)', item + '(full)'])
    })
  })

  // console.log(allData[setting])
  // Filter methods that exist in all_data
  selectedMethods = selectedMethods.filter(selectedMethod =>
    allData[setting].method.hasOwnProperty(selectedMethod)
  )

  // Initialize rank object for each selected method
  selectedMethods.forEach(method => {
    rank[method] = { rank1: 0, rank2: 0, rank3: 0, score: 0 }
  })

  // Process selected metrics, horizons, and datasets to update rankings
  selectDatasets.forEach(dataset => {
    selectMetrics.forEach(metric => {
      const key = `${dataset}-${96}-${metric}`
      const result = allData[setting].result[key]

      const sortedMethods = selectedMethods.sort((a, b) => result[b] - result[a])

      rank[sortedMethods[0]].rank1 += 1
      let i = 1
      while (result[sortedMethods[i]] == 1) {
        rank[sortedMethods[i]].rank1 += 1
        i += 1
      }

      rank[sortedMethods[i]].rank2 += 1
      rank[sortedMethods[i + 1]].rank3 += 1
    })
  })

  const rowDatas = []
  // 根据记分方式计算总分
  Object.keys(rank).forEach(method => {
    if (selectScore === '3') {
      const weight1 = document.getElementById(`score-${setting}/3/1`).value || 0
      const weight2 = document.getElementById(`score-${setting}/3/2`).value || 0
      const weight3 = document.getElementById(`score-${setting}/3/3`).value || 0
      rank[method].score =
        rank[method].rank1 * weight1 + rank[method].rank2 * weight2 + rank[method].rank3 * weight3
    } else if (selectScore === '2') {
      rank[method].score = rank[method].rank1 + rank[method].rank2 + rank[method].rank3
    } else {
      rank[method].score = rank[method].rank1
    }
    rowDatas.push({
      method,
      score: rank[method].score,
      // score: rank[method].score.toFixed(2),
      rank1: rank[method].rank1,
      rank2: rank[method].rank2,
      rank3: rank[method].rank3,
    })
  })
  // console.log(rowDatas)

  // Sort the draw array based on score and ranks
  rowDatas.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.rank1 !== a.rank1) return b.rank1 - a.rank1
    if (b.rank2 !== a.rank2) return b.rank2 - a.rank2
    return b.rank3 - a.rank3
  })

  // Render the table with the calculated draw data
  renderLeaderboard(rowDatas, setting)
}

function renderLeaderboard(rowDatas, setting) {
  const tbody = document.querySelector(`#${setting} tbody`)
  tbody.innerHTML = ''
  const fragment = document.createDocumentFragment()

  function formatNumber(num) {
    // if (num >= 1e9) {
    //     return (num / 1e9).toFixed(1) + 'B';  // 表示十亿
    // } else if (num >= 1e6) {
    //     return (num / 1e6).toFixed(1) + 'M';  // 表示百万
    // } else if (num >= 1e3) {
    //     return (num / 1e3).toFixed(1) + 'K';  // 表示千
    // } else {
    //     return num.toString();  // 小于千的数字
    // }
    return (num / 1e6).toFixed(2) + 'M'
  }

  rowDatas.forEach((rowData, index) => {
    const { method, score, rank1, rank2, rank3 } = rowData
    const methodData = allData[setting].method[method]
    const { parameters, paper_url, publication, bib, year } = methodData
    // <td>${formatNumber(parameters)}</td>

    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${method}</td>
      <td>${score}</td>
      <td>${rank1}</td>
      <td>${rank2}</td>
      <td>${rank3}</td>
      <td><a href="${paper_url}" target="_blank">paper</a></td>
      <td>${publication} [<a href="${bib}" target="_blank">bib</a>]</td>
      <td>${year}</td>
    `
    fragment.appendChild(row)
  })

  tbody.appendChild(fragment)
}

function renderModelMetricsTable(rankCounts, year, tableId) {
  const tableHeader = document.getElementById(tableId).getElementsByTagName('thead')[0]
  const tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0]

  const rowHeader = document.createElement('tr')
  const rowHeaderYear = document.createElement('tr')
  const rowHeader2 = document.createElement('tr')
  const models = []
  year.forEach(res => {
    key = res[0]

    if (key != 'Dataset-Quantity-metrics') {
      models.push(key)
      const th = document.createElement('th')
      // if (key == 'Non-stationary Transformer') {
      //   th.innerHTML = 'Stationary'
      // } else if (key == 'Linear Regression') {
      //   th.innerHTML = 'LR'
      // } else
      th.innerHTML = key
      th.style = 'padding-bottom:5px'
      th.colSpan = 2
      rowHeader.appendChild(th)
    } else {
      const th = document.createElement('th')
      th.innerHTML = 'Model'
      th.className = 'sticky-col-header sticky-col2'
      th.style = 'left:0;vertical-align: middle;'
      th.colSpan = 2
      th.rowSpan = 2
      rowHeader.appendChild(th)
    }
  })

  rowHeader.className = 'sticky-th'
  rowHeader.style = 'z-index:3'
  rowHeaderYear.className = 'sticky-th'
  rowHeaderYear.style = 'top:37.4px;font-size:14px'
  rowHeader2.className = 'sticky-th'
  rowHeader2.style = 'top:62.4px;box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 3px -2px;'
  year.forEach(res => {
    key = res[0]
    if (key != 'Dataset-Quantity-metrics') {
      const thYear = document.createElement('th')
      thYear.style = 'padding:0px;height:25px'
      thYear.innerHTML = res[1]
      thYear.colSpan = 2
      rowHeaderYear.appendChild(thYear)

      const th1 = document.createElement('th')
      const th2 = document.createElement('th')
      th1.innerHTML = 'mse'
      th2.innerHTML = 'mae'
      rowHeader2.appendChild(th1)
      rowHeader2.appendChild(th2)
    } else {
      const th = document.createElement('th')
      th.innerHTML = 'Metrics'
      th.className = 'sticky-col-header sticky-col2'
      th.style = 'left:0'
      th.colSpan = 2
      rowHeader2.appendChild(th)
    }
  })
  tableHeader.appendChild(rowHeader)
  tableHeader.appendChild(rowHeaderYear)
  tableHeader.appendChild(rowHeader2)

  for (let i = 0; i < rankCounts.length; i += 2) {
    if (i + 1 < rankCounts.length) {
      const row = document.createElement('tr')
      result_mae = rankCounts[i]
      result_mse = rankCounts[i + 1]
      mae_sort = findBottomThreeKeys(result_mae)
      mse_sort = findBottomThreeKeys(result_mse)
      year.forEach(res => {
        key = res[0]
        if (key == 'Dataset-Quantity-metrics') {
          const td1 = document.createElement('td')
          const div1 = document.createElement('div')
          const td2 = document.createElement('td')
          dataset = result_mae[key].split('/')[1]
          content = dataset.split('-')
          if (i % 8 == 0) {
            div1.innerHTML = content[0].replace('_', '-')
            if (i % 16 == 0) {
              div1.style =
                ' writing-mode: vertical-rl; transform: rotate(180deg);margin:auto;text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;width: 20px '
              td1.style = 'background-color: #f2f2f2;'
            } else {
              div1.style =
                ' writing-mode: vertical-rl; transform: rotate(180deg);margin:auto;text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale; width: 20px '
              td2.style = 'background-color: #ffffff;'
            }
            td1.className = 'sticky-col'
            td1.rowSpan = 4
            td1.appendChild(div1)
            row.appendChild(td1)
          }

          td2.innerHTML = content[1]

          td2.className = 'sticky-col2'
          if (i % 4 == 0) {
            td2.style = 'background-color: #ffffff;'
          } else {
            td2.style = 'background-color: #f2f2f2;'
          }

          row.appendChild(td2)
        } else {
          const td1 = document.createElement('td')
          const td2 = document.createElement('td')
          if (key == mae_sort['minKey']) {
            td1.innerHTML = '<b>' + format(result_mae[key]) + '</b>'
          } else if (key == mae_sort['thirdMinKey']) {
            td1.innerHTML = '<u>' + format(result_mae[key]) + '</u>'
          } else if (key == mae_sort['secondMinKey']) {
            td1.innerHTML = '<p class="double-underline">' + format(result_mae[key]) + '</p>'
          } else {
            td1.innerHTML = format(result_mae[key])
          }

          if (key == mse_sort['minKey']) {
            td2.innerHTML = '<b>' + format(result_mse[key]) + '</b>'
          } else if (key == mse_sort['thirdMinKey']) {
            td2.innerHTML = '<u>' + format(result_mse[key]) + '</u>'
          } else if (key == mse_sort['secondMinKey']) {
            td2.innerHTML = '<p class="double-underline">' + format(result_mse[key]) + '</p>'
          } else {
            td2.innerHTML = format(result_mse[key])
          }

          row.appendChild(td2)
          row.appendChild(td1)
        }
      })
      tableBody.append(row)
    }
  }
}

let lastValidValue = ''
function validateInput(input, setting = 'few') {
  let value = input.value

  // 保存光标位置
  const cursorPos = input.selectionStart

  // 处理整数和小数部分
  let [integerPart, decimalPart] = value.split('.')

  // 处理整数部分：去除前导零并限制最大两位数

  // 去除前导零
  if (integerPart.length > 1) {
    integerPart = integerPart.replace(/^0+/, '')
  }

  // 处理小数部分：限制最多两位
  if (decimalPart) {
    decimalPart = decimalPart.slice(0, 2)
  }

  // 合并整数部分和小数部分
  let newValue = integerPart
  if (decimalPart) {
    newValue += `.${decimalPart}`
  }

  // 如果小数点后有数字，但是小数点前的数字部分为空，应至少显示 `0`
  if (newValue === '' || newValue === '.') {
    newValue = '0'
  }

  // 验证并更新输入值
  if (newValue !== value) {
    input.value = newValue
  }

  // 更新最后一个有效值
  lastValidValue = input.value

  // 恢复光标的位置
  // input.setSelectionRange(cursorPos, cursorPos);
  submitSelection(setting)
}
