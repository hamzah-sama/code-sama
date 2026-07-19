export const Header = () => {
  return (
    <box alignItems="center" justifyContent="center">
      <box
        justifyContent="center"
        alignItems="center"
        flexDirection="row"
        gap={1}
      >
        <ascii-font font="tiny" text="CODE" color='gray'/>
        <ascii-font font="tiny" text="-" color='#292828'/>
        <ascii-font font="tiny" text="SAMA" />
      </box>
    </box>
  );
};
