import { defineComponent } from "vue";
import NestedComponent from "./NestedComponent.jsx";
import { computed, reactive, unref, watch } from "vue";
import { Checkbox } from "ant-design-vue";
import {
  NEST_CHECKED,
  NEST_CHECKED_LEFT,
  NEST_CHECKED_RIGHT,
  isNumber,
} from "../config";
import styles from "./nestTable.module.less";

export default defineComponent({
  components: {
    NestedComponent,
    Checkbox,
  },
  props: {
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
  },
  emits: [
    "update:modelValue",
    "update:expandedRowKeys",
    "start",
    "end",
    "move",
  ],
  setup(props, { emit, slots }) {
    // *********************
    // Hooks Function
    // *********************

    const state = reactive({
      checkAll: false,
      indeterminate: false,
    });

    const list = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const rowKeys = computed({
      get: () => props.expandedRowKeys,
      set: (value) => emit("update:expandedRowKeys", value),
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
      const existSlot = antColumns.value.filter(
        (item) => slots[item.dataIndex]
      );
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
      emit("start", evt);
    };

    const end = (evt) => {
      emit("end", evt);
    };

    const move = (evt) => {
      emit("move", evt);
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

    // *********************
    // Render Function
    // *********************

    let rSlots = renderSlots.value
      .map((item) => ({
        [item.dataIndex]: ({ record, text }) => {
          return slots[item.dataIndex]({ record, text });
        },
      }))
      .reduce((pre, cur) => ({ ...pre, ...cur }), {});

    return () => (
      <div class={styles.tableWrap}>
        <div class={styles.tableHeader} style={gridLayout.value}>
          {antColumns.value.map((item) => (
            <div class={styles.tableHeaderItem}>
              {item.dataIndex === NEST_CHECKED ? (
                <div class={[styles.itemCell, styles.nestChecked]}>
                  <Checkbox
                    v-model:checked={state.checkAll}
                    indeterminate={state.indeterminate}
                    onChange={onCheckAllChange}
                  />
                </div>
              ) : (
                <div class={styles.itemCell}>{item.title}</div>
              )}
            </div>
          ))}
        </div>
        <NestedComponent
          v-model={list.value}
          v-model:expandedRowKeys={rowKeys.value}
          columns={antColumns.value}
          indentSize={props.indentSize}
          handle={props.handle}
          rowSelection={props.rowSelection}
          rowClassName={props.rowClassName}
          onStart={start}
          onEnd={end}
          onMove={move}
          v-slots={rSlots}
        ></NestedComponent>
      </div>
    );
  },
});
