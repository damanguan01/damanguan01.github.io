// 当前选中的表格名称
let currentTableName = '';

function showAddForm() {
    document.getElementById('addForm').style.display = 'block';
}

function hideAddForm() {
    document.getElementById('addForm').style.display = 'none';
}

function showColumnForm() {
    document.getElementById('columnForm').style.display = 'block';
    updateExistingColumnsList();
}

function hideColumnForm() {
    document.getElementById('columnForm').style.display = 'none';
}

function updateExistingColumnsList() {
    const thead = document.querySelector('#dataTable thead tr');
    const columns = Array.from(thead.cells).slice(0, -1); // 排除"操作"列
    const container = document.getElementById('existingColumns');
    
    container.innerHTML = '<h4>现有列：</h4>';
    const ul = document.createElement('ul');
    
    columns.forEach((cell, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${cell.textContent}
            <button onclick="deleteColumn(${index})" class="delete-column">删除</button>
        `;
        ul.appendChild(li);
    });
    
    container.appendChild(ul);
}

function addColumn(event) {
    event.preventDefault();
    const columnName = document.getElementById('columnName').value;
    
    // 添加表头
    const thead = document.querySelector('#dataTable thead tr');
    const operationCell = thead.lastElementChild;
    const newHeaderCell = document.createElement('th');
    newHeaderCell.textContent = columnName;
    thead.insertBefore(newHeaderCell, operationCell);
    
    // 为每一行添加新单元格
    const tbody = document.querySelector('#dataTable tbody');
    tbody.querySelectorAll('tr').forEach(row => {
        const operationCell = row.lastElementChild;
        const newCell = document.createElement('td');
        newCell.textContent = '-';
        row.insertBefore(newCell, operationCell);
    });
    
    // 更新表单
    updateAddFormFields();
    
    document.getElementById('columnName').value = '';
    updateExistingColumnsList();
    saveToLocalStorage();
}

function deleteColumn(index) {
    if (!confirm('确定要删除这一列吗？')) return;
    
    const table = document.getElementById('dataTable');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        row.deleteCell(index);
    });
    
    updateAddFormFields();
    updateExistingColumnsList();
    saveToLocalStorage();
}

function updateAddFormFields() {
    const thead = document.querySelector('#dataTable thead tr');
    const columns = Array.from(thead.cells).slice(0, -1); // 排除"操作"列
    const form = document.querySelector('#addForm form');
    
    // 清除现有字段
    const existingFields = form.querySelectorAll('.form-group');
    existingFields.forEach(field => field.remove());
    
    // 重新创建字段
    columns.forEach(cell => {
        const fieldName = cell.textContent.toLowerCase();
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label for="${fieldName}">${cell.textContent}：</label>
            ${fieldName === '日期' ? 
                `<input type="date" id="${fieldName}" required>` :
                fieldName === '数值' ?
                `<input type="number" id="${fieldName}" required>` :
                `<input type="text" id="${fieldName}" required>`
            }
        `;
        form.insertBefore(div, form.lastElementChild);
    });
}

function addData(event) {
    event.preventDefault();
    
    const thead = document.querySelector('#dataTable thead tr');
    const columns = Array.from(thead.cells).slice(0, -1); // 排除"操作"列
    
    const tbody = document.querySelector('#dataTable tbody');
    const newRow = tbody.insertRow();
    
    // 添加数据单元格
    columns.forEach(cell => {
        const fieldName = cell.textContent.toLowerCase();
        const value = document.getElementById(fieldName).value;
        const td = newRow.insertCell();
        td.textContent = value;
    });
    
    // 添加操作按钮
    const operationCell = newRow.insertCell();
    operationCell.innerHTML = `
        <button onclick="editRow(this)">编辑</button>
        <button onclick="deleteRow(this)">删除</button>
    `;
    
    hideAddForm();
    event.target.reset();
    saveToLocalStorage();
}

function deleteRow(button) {
    if (confirm('确定要删除这条记录吗？')) {
        const row = button.parentNode.parentNode;
        row.parentNode.removeChild(row);
        saveToLocalStorage();
    }
}

function editRow(button) {
    const row = button.parentNode.parentNode;
    const thead = document.querySelector('#dataTable thead tr');
    const columns = Array.from(thead.cells).slice(0, -1); // 排除"操作"列
    
    columns.forEach((cell, index) => {
        const fieldName = cell.textContent.toLowerCase();
        const value = row.cells[index].textContent;
        document.getElementById(fieldName).value = value;
    });
    
    showAddForm();
    row.parentNode.removeChild(row);
}

// 添加图片处理函数
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const displayImage = document.getElementById('displayImage');
            const placeholder = document.querySelector('.image-placeholder');
            
            displayImage.src = e.target.result;
            displayImage.style.display = 'block';
            placeholder.style.display = 'none';
            
            saveToLocalStorage();
        };
        reader.readAsDataURL(file);
    }
}

// 添加导出图片功能
async function exportAsImage() {
    // 获取要导出的区域
    const exportArea = document.createElement('div');
    exportArea.style.padding = '20px';
    exportArea.style.background = 'white';
    
    // 克隆图片区域
    const imageCell = document.querySelector('.image-cell').cloneNode(true);
    exportArea.appendChild(imageCell);
    
    // 克隆表格并移除操作列
    const table = document.querySelector('#dataTable').cloneNode(true);
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        // 移除每行的最后一个单元格（操作列）
        row.deleteCell(-1);
    });
    exportArea.appendChild(table);
    
    // 临时将导出区域添加到文档中
    document.body.appendChild(exportArea);
    
    try {
        // 使用 html2canvas 将区域转换为 canvas
        const canvas = await html2canvas(exportArea, {
            scale: 2, // 提高导出图片质量
            backgroundColor: 'white',
            logging: false
        });
        
        // 将 canvas 转换为图片 URL
        const image = canvas.toDataURL('image/png');
        
        // 创建下载链接
        const link = document.createElement('a');
        
        // 检查是否是移动设备
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // 移动设备：尝试使用 Web Share API
            if (navigator.share) {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], 'table-export.png', { type: 'image/png' });
                try {
                    await navigator.share({
                        files: [file],
                        title: '导出的数据表格',
                    });
                } catch (error) {
                    console.error('分享失败:', error);
                    // 如果分享失败，回退到直接下载
                    downloadImage(image);
                }
            } else {
                // 如果不支持 Web Share API，回退到直接下载
                downloadImage(image);
            }
        } else {
            // 桌面设备：直接下载
            downloadImage(image);
        }
    } catch (error) {
        console.error('导出图片失败:', error);
        alert('导出图片失败，请重试');
    } finally {
        // 清理临时元素
        document.body.removeChild(exportArea);
    }
}

// 下载图片的辅助函数
function downloadImage(dataUrl) {
    const link = document.createElement('a');
    link.download = 'table-export.png';
    link.href = dataUrl;
    link.click();
}

// 页面加载时初始化表单字段
window.onload = function() {
    updateTableSelector();
    loadFromLocalStorage();
    updateAddFormFields();
};

function showStyleForm() {
    document.getElementById('styleForm').style.display = 'block';
    
    // 加载当前样式到表单
    const root = document.documentElement;
    document.getElementById('borderColor').value = getComputedStyle(root).getPropertyValue('--table-border-color').trim();
    document.getElementById('headerBgColor').value = getComputedStyle(root).getPropertyValue('--table-header-bg').trim();
    document.getElementById('headerTextColor').value = getComputedStyle(root).getPropertyValue('--table-header-text').trim();
    document.getElementById('rowBgColor').value = getComputedStyle(root).getPropertyValue('--table-row-bg').trim();
    document.getElementById('rowTextColor').value = getComputedStyle(root).getPropertyValue('--table-row-text').trim();
    
    const borderWidth = getComputedStyle(root).getPropertyValue('--table-border-width').replace('px', '');
    document.getElementById('borderWidth').value = borderWidth;
    document.getElementById('borderWidthValue').textContent = borderWidth + 'px';
}

function hideStyleForm() {
    document.getElementById('styleForm').style.display = 'none';
}

function applyTableStyle(event) {
    event.preventDefault();
    
    const root = document.documentElement;
    root.style.setProperty('--table-border-color', document.getElementById('borderColor').value);
    root.style.setProperty('--table-header-bg', document.getElementById('headerBgColor').value);
    root.style.setProperty('--table-header-text', document.getElementById('headerTextColor').value);
    root.style.setProperty('--table-row-bg', document.getElementById('rowBgColor').value);
    root.style.setProperty('--table-row-text', document.getElementById('rowTextColor').value);
    root.style.setProperty('--table-border-width', document.getElementById('borderWidth').value + 'px');
    
    hideStyleForm();
    saveToLocalStorage();
}

function resetTableStyle() {
    const root = document.documentElement;
    root.style.setProperty('--table-border-color', '#2c3e50');
    root.style.setProperty('--table-header-bg', '#2c3e50');
    root.style.setProperty('--table-header-text', '#ffffff');
    root.style.setProperty('--table-row-bg', '#ffffff');
    root.style.setProperty('--table-row-text', '#333333');
    root.style.setProperty('--table-border-width', '2px');
    
    // 更新表单值
    showStyleForm();
}

// 添加边框宽度滑块事件监听
document.getElementById('borderWidth')?.addEventListener('input', function(e) {
    document.getElementById('borderWidthValue').textContent = e.target.value + 'px';
});

// 显示新建表格表单
function showNewTableForm() {
    document.getElementById('newTableForm').style.display = 'block';
}

// 隐藏新建表格表单
function hideNewTableForm() {
    document.getElementById('newTableForm').style.display = 'none';
    document.getElementById('tableName').value = '';
}

// 创建新表格
function createNewTable(event) {
    event.preventDefault();
    const tableName = document.getElementById('tableName').value.trim();
    
    // 检查表格名是否已存在
    const tables = JSON.parse(localStorage.getItem('tables') || '{}');
    if (tables[tableName]) {
        alert('表格名称已存在，请使用其他名称');
        return;
    }
    
    // 创建新表格
    currentTableName = tableName;
    
    // 清空当前表格数据
    resetTableToDefault();
    
    // 保存新表格
    saveToLocalStorage();
    
    // 更新表格选择器
    updateTableSelector();
    
    hideNewTableForm();
}

// 切换表格
function switchTable(tableName) {
    if (!tableName) return;
    
    // 保存当前表格
    if (currentTableName) {
        saveToLocalStorage();
    }
    
    currentTableName = tableName;
    loadFromLocalStorage();
}

// 删除当前表格
function deleteCurrentTable() {
    if (!currentTableName) {
        alert('请先选择一个表格');
        return;
    }
    
    if (!confirm(`确定要删除表格"${currentTableName}"吗？此操作不可恢复。`)) {
        return;
    }
    
    const tables = JSON.parse(localStorage.getItem('tables') || '{}');
    delete tables[currentTableName];
    localStorage.setItem('tables', JSON.stringify(tables));
    
    currentTableName = '';
    resetTableToDefault();
    updateTableSelector();
}

// 重置表格为默认状态
function resetTableToDefault() {
    // 重置表头
    const thead = document.querySelector('#dataTable thead tr');
    thead.innerHTML = `
        <th>日期</th>
        <th>项目</th>
        <th>数值</th>
        <th>备注</th>
        <th>操作</th>
    `;
    
    // 清空表格数据
    document.querySelector('#dataTable tbody').innerHTML = '';
    
    // 重置样式
    resetTableStyle();
    
    // 清除图片
    const displayImage = document.getElementById('displayImage');
    const placeholder = document.querySelector('.image-placeholder');
    displayImage.src = '';
    displayImage.style.display = 'none';
    placeholder.style.display = 'flex';
    
    // 更新表单
    updateAddFormFields();
    updateExistingColumnsList();
}

// 更新表格选择器
function updateTableSelector() {
    const selector = document.getElementById('tableSelector');
    const tables = JSON.parse(localStorage.getItem('tables') || '{}');
    
    selector.innerHTML = '<option value="">选择表格</option>';
    Object.keys(tables).forEach(tableName => {
        const option = document.createElement('option');
        option.value = tableName;
        option.textContent = tableName;
        if (tableName === currentTableName) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

// 修改保存函数以支持多表格
function saveToLocalStorage() {
    try {
        if (!currentTableName) return;
        
        // 获取当前表格数据
        const saveData = {
            tableData: [],
            columnNames: [],
            styles: {},
            imageData: null
        };
        
        // 保存表格数据
        const thead = document.querySelector('#dataTable thead tr');
        const columns = Array.from(thead.cells).slice(0, -1); // 排除操作列
        const tbody = document.querySelector('#dataTable tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const rowData = {};
            columns.forEach((column, index) => {
                rowData[column.textContent] = row.cells[index].textContent;
            });
            saveData.tableData.push(rowData);
        });
        
        // 保存列信息
        saveData.columnNames = columns.map(col => col.textContent);
        
        // 保存样式设置
        const root = document.documentElement;
        saveData.styles = {
            borderColor: getComputedStyle(root).getPropertyValue('--table-border-color').trim(),
            headerBg: getComputedStyle(root).getPropertyValue('--table-header-bg').trim(),
            headerText: getComputedStyle(root).getPropertyValue('--table-header-text').trim(),
            rowBg: getComputedStyle(root).getPropertyValue('--table-row-bg').trim(),
            rowText: getComputedStyle(root).getPropertyValue('--table-row-text').trim(),
            borderWidth: getComputedStyle(root).getPropertyValue('--table-border-width').trim()
        };
        
        // 保存图片
        const displayImage = document.getElementById('displayImage');
        saveData.imageData = displayImage.style.display !== 'none' ? displayImage.src : null;
        
        // 保存到对应的表格中
        const tables = JSON.parse(localStorage.getItem('tables') || '{}');
        tables[currentTableName] = saveData;
        localStorage.setItem('tables', JSON.stringify(tables));
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，可能是存储空间已满');
    }
}

// 修改加载函数以支持多表格
function loadFromLocalStorage() {
    if (!currentTableName) {
        resetTableToDefault();
        return;
    }
    
    const tables = JSON.parse(localStorage.getItem('tables') || '{}');
    const savedData = tables[currentTableName];
    if (!savedData) {
        resetTableToDefault();
        return;
    }
    
    // 恢复列
    if (savedData.columnNames && savedData.columnNames.length > 0) {
        // 清除现有列（保留操作列）
        const thead = document.querySelector('#dataTable thead tr');
        while (thead.cells.length > 1) {
            thead.deleteCell(0);
        }
        
        // 添加保存的列
        savedData.columnNames.forEach(columnName => {
            const newHeaderCell = document.createElement('th');
            newHeaderCell.textContent = columnName;
            thead.insertBefore(newHeaderCell, thead.lastElementChild);
        });
    }
    
    // 恢复表格数据
    if (savedData.tableData && savedData.tableData.length > 0) {
        const tbody = document.querySelector('#dataTable tbody');
        tbody.innerHTML = ''; // 清除示例数据
        
        savedData.tableData.forEach(rowData => {
            const newRow = tbody.insertRow();
            Object.values(rowData).forEach(cellData => {
                const cell = newRow.insertCell();
                cell.textContent = cellData;
            });
            
            // 添加操作按钮
            const operationCell = newRow.insertCell();
            operationCell.innerHTML = `
                <button onclick="editRow(this)">编辑</button>
                <button onclick="deleteRow(this)">删除</button>
            `;
        });
    }
    
    // 恢复样式设置
    if (savedData.styles) {
        const root = document.documentElement;
        root.style.setProperty('--table-border-color', savedData.styles.borderColor);
        root.style.setProperty('--table-header-bg', savedData.styles.headerBg);
        root.style.setProperty('--table-header-text', savedData.styles.headerText);
        root.style.setProperty('--table-row-bg', savedData.styles.rowBg);
        root.style.setProperty('--table-row-text', savedData.styles.rowText);
        root.style.setProperty('--table-border-width', savedData.styles.borderWidth);
    }
    
    // 恢复图片
    if (savedData.imageData) {
        const displayImage = document.getElementById('displayImage');
        const placeholder = document.querySelector('.image-placeholder');
        displayImage.src = savedData.imageData;
        displayImage.style.display = 'block';
        placeholder.style.display = 'none';
    }
    
    // 更新表单字段
    updateAddFormFields();
    updateExistingColumnsList();
}

// 添加页面关闭保存
window.addEventListener('beforeunload', function() {
    saveToLocalStorage();
});

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
} 