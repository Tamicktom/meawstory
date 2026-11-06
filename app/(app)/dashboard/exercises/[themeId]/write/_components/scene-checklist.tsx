type SceneChecklistProps = {
  items: string[]
  checked: string[]
  disabled: boolean
  onToggle: (item: string, checked: boolean) => void
}

export function SceneChecklist(props: SceneChecklistProps) {
  if (props.items.length === 0) return null
  const marked = new Set(props.checked)

  return (
    <fieldset disabled={props.disabled} className="flex flex-col gap-3">
      <legend>Checklist da cena</legend>
      {props.items.map((item) => (
        <label key={item} className="flex gap-3 py-2">
          <input
            type="checkbox"
            checked={marked.has(item)}
            onChange={(event) => props.onToggle(item, event.target.checked)}
          />
          {item}
        </label>
      ))}
    </fieldset>
  )
}
