import { VueDraggable } from "vue-draggable-plus";
import { computed, defineComponent, Fragment } from "vue";
import { Checkbox } from "ant-design-vue";
import { CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons-vue";
import {
  NEST_CHECKED,
  NEST_CHECKED_LEFT,
  NEST_CHECKED_RIGHT,
  isNumber,
} from "../config";

import styles from "./nestedComponent.module.less";

export default defineComponent({
  name: "NestedComponent",
  components: {
    VueDraggable,
    Checkbox,
    CaretDownOutlined,
    CaretRightOutlined,
  },
  props: {
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

    const list = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    const rowKeys = computed({
      get: () => props.expandedRowKeys,
      set: (value) => emit("update:expandedRowKeys", value),
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
      emit("update:expandedRowKeys", expandedRowKeys);
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
      emit("start", evt);
    };
    const end = (evt) => {
      emit("end", evt);
    };

    const move = (evt) => {
      emit("move", evt);
    };

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
      <VueDraggable
        class={styles.dragArea}
        tag="div"
        animation={150}
        v-model={list.value}
        handle={props.handle}
        group="g1"
        onStart={start}
        onEnd={end}
        onMove={move}
        chosenClass={styles.sortableChosen}
      >
        {props.modelValue.map((el) => (
          <div id={el.name}>
            <div
              class={[styles.gridLayout, props.rowClassName?.(el)]}
              style={gridLayout.value}
            >
              {props.columns.map((item, index) => (
                <Fragment>
                  {item.dataIndex === NEST_CHECKED ? (
                    <div class={[styles.itemCellWrap, styles.nestChecked]}>
                      <div class={styles.itemCell}>
                        {slots[NEST_CHECKED_LEFT]?.({ record: el })}
                        <Checkbox
                          checked={props.rowSelection.selectedRowKeys.includes(
                            el.id
                          )}
                          onChange={(evt) => onCheckChange(evt, el)}
                        />
                        {slots[NEST_CHECKED_RIGHT]?.({ record: el })}
                      </div>
                    </div>
                  ) : (
                    <div
                      class={styles.itemCellWrap}
                      style={{
                        marginLeft:
                          index === 1
                            ? `${props.indentSize * props.level}px`
                            : 0,
                      }}
                    >
                      <div class={styles.itemCell}>
                        {index === 1 && el.children ? (
                          props.expandedRowKeys.includes(el.id) ? (
                            <CaretDownOutlined onClick={() => toggle(el)} />
                          ) : (
                            <CaretRightOutlined onClick={() => toggle(el)} />
                          )
                        ) : null}
                        {slots[item.dataIndex] ? (
                          slots[item.dataIndex]({
                            record: el,
                            text: el[item.dataIndex],
                          })
                        ) : (
                          <Fragment>{el[item.dataIndex]}</Fragment>
                        )}
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {props.expandedRowKeys.includes(el.id) && el.children?.length ? (
              <Fragment>
                <NestedComponent
                  v-model={el.children}
                  v-model:expandedRowKeys={rowKeys.value}
                  columns={props.columns}
                  indentSize={props.indentSize}
                  level={props.level + 1}
                  handle={props.handle}
                  rowSelection={props.rowSelection}
                  rowClassName={props.rowClassName}
                  onStart={start}
                  onEnd={end}
                  onMove={move}
                  v-slots={rSlots}
                ></NestedComponent>
              </Fragment>
            ) : null}
          </div>
        ))}
      </VueDraggable>
    );
  },
});
