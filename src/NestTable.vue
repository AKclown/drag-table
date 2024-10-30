<template>
  <div class="table-wrap">
    <div class="table-header" :style="gridLayout">
      <div class="table-header-item" v-for="item in antColumns">
        <!-- 复选行  -->
        <div
          class="item-cell nestChecked"
          v-if="item.dataIndex === NEST_CHECKED"
        >
          <Checkbox
            v-model:checked="state.checkAll"
            :indeterminate="state.indeterminate"
            @change="onCheckAllChange"
          />
        </div>
        <div class="item-cell" v-else>{{ item.title }}</div>
      </div>
    </div>
    <NestedComponent
      v-model="list"
      v-model:expandedRowKeys="rowKeys"
      :columns="antColumns"
      :indentSize="indentSize"
      :handle="handle"
      :rowSelection="rowSelection"
      :rowClassName="rowClassName"
      @start="start"
      @end="end"
      @move="move"
    >
      <template
        v-for="item in renderSlots"
        #[item.dataIndex]="{ record, text }"
      >
        <slot :name="item.dataIndex" :record="record" :text="text"></slot>
      </template>
    </NestedComponent>
  </div>
</template>

<script setup>
import NestedComponent from "./NestedComponent.vue";
import { computed, reactive, useSlots, unref, watch } from "vue";
import { Checkbox } from "ant-design-vue";
import {
  NEST_CHECKED,
  NEST_CHECKED_LEFT,
  NEST_CHECKED_RIGHT,
  isNumber,
} from "./config";

// *********************
// Hooks Function
// *********************

const slots = useSlots();

const props = defineProps({
  // 列表数据
  modelValue: {
    type: Array,
    default: [],
  },
  // 扩展的ids列表
  expandedRowKeys: {
    type: Array,
    default: [],
  },
  // 层级缩进，默认15px
  indentSize: {
    type: Number,
    default: 15,
  },
  // 列配置
  columns: {
    type: Array,
    default: [],
  },
  // 拖拽时的handle，默认是整个行
  handle: {
    type: String,
  },
  // 选中行 目前只是实现selectedRowKeys和onChange
  rowSelection: {
    type: Object,
  },
  // 自定义行className
  rowClassName: {
    type: Function,
  },
});
const emits = defineEmits([
  "update:modelValue",
  "update:expandedRowKeys",
  "start",
  "end",
  "move",
]);

const state = reactive({
  checkAll: false,
  indeterminate: false,
});

const list = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value),
});

const rowKeys = computed({
  get: () => props.expandedRowKeys,
  set: (value) => emits("update:expandedRowKeys", value),
});

const antColumns = computed(() => {
  // 是否存在rowSelection，存在則主动新增一列
  if (props.rowSelection) {
    return [
      {
        title: " ",
        dataIndex: NEST_CHECKED,
        width: 80,
      },
      ...props.columns,
    ];
  } else {
    return props.columns;
  }
});

const gridLayout = computed(() => {
  const gridColumns = antColumns.value
    .map((item) => {
      return item.width
        ? isNumber(item.width)
          ? `${item.width}px`
          : item.width
        : `1fr`;
    })
    .join(" ");

  return { "grid-template-columns": `${gridColumns}` };
});

// 插槽
const renderSlots = computed(() => {
  const existSlot = antColumns.value.filter((item) => slots[item.dataIndex]);
  // 添加复选的两个插槽
  return [
    { dataIndex: NEST_CHECKED_LEFT },
    { dataIndex: NEST_CHECKED_RIGHT },
    ...existSlot,
  ];
});

// 所有的数据
const allItems = computed(() => {
  return flattenTree(list.value);
});

const allItemIds = computed(() => {
  return allItems.value.map((item) => item.id);
});

// *********************
// Default Function
// *********************

// *********************
// Life Event Function
// *********************

// *********************
// Service Function
// *********************

function flattenTree(tree) {
  const result = [];
  function recurse(node) {
    result.push({ id: node.id, name: node.name });

    if (node.children) {
      node.children.forEach((child) => recurse(child));
    }
  }
  tree.forEach((node) => recurse(node));
  return result;
}

const onCheckAllChange = (evt) => {
  if (evt.target.checked) {
    props.rowSelection.onChange(unref(allItemIds));
  } else {
    props.rowSelection.onChange([]);
  }
};

const start = (evt) => {
  emits("start", evt);
};

const end = (evt) => {
  emits("end", evt);
};

const move = (evt) => {
  emits("move", evt);
};

// *********************
// Watch Function
// *********************

watch(
  () => props.rowSelection?.selectedRowKeys,
  (val) => {
    // 监听selectedRowKeys的变化，更新checkAll和indeterminate
    if (val.length === allItemIds.value.length) {
      state.indeterminate = false;
      state.checkAll = true;
    } else if (val.length === 0) {
      state.indeterminate = false;
      state.checkAll = false;
    } else {
      state.checkAll = false;
      state.indeterminate = true;
    }
  },
  {
    deep: true,
    immediate: true,
  }
);
</script>

<style scoped lang="less">
.table-wrap {
  width: 100%;
}
.table-header {
  display: grid;
  width: 100%;
  background: #fafafa;
  .table-header-item {
    color: rgba(0, 0, 0, 0.88);
    font-weight: 600;
    padding: 13px 16px;
    border-bottom: 1px solid #f0f0f0;
  }
}

.nestChecked {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
