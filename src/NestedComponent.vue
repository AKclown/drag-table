<template>
  <VueDraggable
    class="drag-area"
    tag="div"
    :animation="150"
    v-model="list"
    :handle="handle"
    group="g1"
    @start="start"
    @end="end"
    @move="move"
  >
    <div v-for="el in modelValue" :id="el.name">
      <div :class="['grid-layout', rowClassName?.(el)]" :style="gridLayout">
        <template v-for="(item, index) in columns">
          <!-- 复选行  -->
          <div
            class="item-cell-wrap nestChecked"
            v-if="item.dataIndex === NEST_CHECKED"
          >
            <div class="item-cell">
              <slot
                v-if="$slots[NEST_CHECKED_LEFT]"
                :name="NEST_CHECKED_LEFT"
                :record="el"
              ></slot>
              <Checkbox
                :checked="rowSelection.selectedRowKeys.includes(el.id)"
                @change="(evt) => onCheckChange(evt, el)"
              />
              <slot
                v-if="$slots[NEST_CHECKED_RIGHT]"
                :name="NEST_CHECKED_RIGHT"
                :record="el"
              ></slot>
            </div>
          </div>
          <!-- 标签插槽 -->
          <div
            class="item-cell-wrap"
            v-else
            :style="{ marginLeft: index === 1 ? `${indentSize * level}px` : 0 }"
          >
            <div class="item-cell">
              <span v-if="index === 1 && el.children">
                <CaretDownOutlined
                  v-if="expandedRowKeys.includes(el.id)"
                  @click="toggle(el)"
                />
                <CaretRightOutlined v-else @click="toggle(el)" />
              </span>
              <slot
                v-if="$slots[item.dataIndex]"
                :name="item.dataIndex"
                :record="el"
                :text="el[item.dataIndex]"
              ></slot>
              <template v-else>{{ el[item.dataIndex] }}</template>
            </div>
          </div>
        </template>
      </div>
      <div v-if="expandedRowKeys.includes(el.id)">
        <nested-component
          v-model="el.children"
          v-model:expandedRowKeys="rowKeys"
          :columns="columns"
          :indentSize="indentSize"
          :level="level + 1"
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
            <slot
              v-if="$slots[item.dataIndex]"
              :name="item.dataIndex"
              :record="record"
              :text="text"
            ></slot>
          </template>
        </nested-component>
      </div>
    </div>
  </VueDraggable>
</template>
<script setup>
import { VueDraggable } from "vue-draggable-plus";
import { defineEmits, defineProps, computed, useSlots } from "vue";
import { Checkbox } from "ant-design-vue";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons-vue";
import {
  NEST_CHECKED,
  NEST_CHECKED_LEFT,
  NEST_CHECKED_RIGHT,
  isNumber,
} from "./config";

const slots = useSlots();

// *********************
// Hooks Function
// *********************

const props = defineProps({
  modelValue: {
    type: Array,
    default: [],
  },
  expandedRowKeys: {
    type: Array,
    default: [],
  },
  indentSize: {
    type: Number,
    default: 15,
  },
  columns: {
    type: Array,
    default: [],
  },
  handle: {
    type: String,
  },
  rowSelection: {
    type: Object,
  },
  rowClassName: {
    type: Function,
  },
  level: {
    type: Number,
    default: 0,
  },
});

const emits = defineEmits([
  "update:modelValue",
  "update:expandedRowKeys",
  "start",
  "end",
  "move",
]);

const list = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value),
});

const rowKeys = computed({
  get: () => props.expandedRowKeys,
  set: (value) => emits("update:expandedRowKeys", value),
});

const gridLayout = computed(() => {
  const gridColumns = props.columns
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
  const existSlot = props.columns.filter((item) => slots[item.dataIndex]);
  // 添加复选的两个插槽
  return [
    { dataIndex: NEST_CHECKED_LEFT },
    { dataIndex: NEST_CHECKED_RIGHT },
    ...existSlot,
  ];
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

const toggle = (el) => {
  const expandedRowKeys = [...props.expandedRowKeys];
  const index = expandedRowKeys.indexOf(el.id);
  if (~index) {
    expandedRowKeys.splice(index, 1);
  } else {
    expandedRowKeys.push(el.id);
  }
  emits("update:expandedRowKeys", expandedRowKeys);
};

const onCheckChange = (evt, item) => {
  if (evt.target.checked) {
    // 添加
    const selectedRowKeys = props.rowSelection.selectedRowKeys;
    props.rowSelection.onChange([...selectedRowKeys, item.id]);
  } else {
    // 移除
    const selectedRowKeys = props.rowSelection.selectedRowKeys.filter(
      (id) => id !== item.id
    );
    props.rowSelection.onChange(selectedRowKeys);
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
</script>

<style scoped lang="less">
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: keep-all;
}
.grid-layout {
  width: 100%;
  display: grid;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #fafafa;
  }
  .item-cell-wrap {
    display: flex;
    align-items: center;
    padding: 13px 16px;
    overflow: hidden;
    .item-cell {
      width: 100%;
      font-size: 14px;
      word-wrap: break-word;
    }
  }
}

.grid-full-row {
  grid-column: 1 / span 4;
}

.sortable-chosen {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.25);
}

.nestChecked {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
